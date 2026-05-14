import { Storage } from '@google-cloud/storage';
import { PassThrough, Readable, Writable } from 'stream';
import { GcsStorageDriver } from './gcs-storage.driver';
import { AppConfigService } from '../../../../config/app-config.service';
import { StorageDriver } from '../../../../config/environment-variables';
import { InfrastructureException } from '../../../../shared/exceptions/app-error';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';

jest.mock('@google-cloud/storage');
const MockStorage = Storage as jest.MockedClass<typeof Storage>;

interface MockedConfig
  extends Pick<
    AppConfigService,
    'storageDriver' | 'gcsProjectId' | 'gcsBucketName' | 'gcsServiceAccountKey'
  > {}

function makeConfig(overrides: Partial<MockedConfig> = {}): AppConfigService {
  return {
    storageDriver: StorageDriver.Gcs,
    gcsProjectId: 'test-project',
    gcsBucketName: 'test-bucket',
    gcsServiceAccountKey: undefined,
    ...overrides,
  } as unknown as AppConfigService;
}

function mockStorageImpl({
  signedUrl = 'https://storage.googleapis.com/test/url',
  exists = true,
  writeSink,
  deleteImpl,
}: {
  signedUrl?: string;
  exists?: boolean;
  /** Optional override for `file.createWriteStream()` — useful for
   *  asserting on what got written or simulating a write failure. */
  writeSink?: Writable;
  deleteImpl?: jest.Mock;
} = {}) {
  const getSignedUrl = jest.fn().mockResolvedValue([signedUrl]);
  const existsFn = jest.fn().mockResolvedValue([exists]);
  const createWriteStream = jest.fn().mockReturnValue(writeSink ?? new PassThrough());
  const deleteFn = deleteImpl ?? jest.fn().mockResolvedValue(undefined);
  const file = jest.fn().mockReturnValue({
    getSignedUrl,
    exists: existsFn,
    createWriteStream,
    delete: deleteFn,
  });
  const bucket = jest.fn().mockReturnValue({ file });
  MockStorage.mockImplementation(() => ({ bucket }) as unknown as Storage);
  return { bucket, file, getSignedUrl, existsFn, createWriteStream, deleteFn };
}

describe('GcsStorageDriver', () => {
  beforeEach(() => {
    MockStorage.mockClear();
  });

  describe('onModuleInit — local mode short-circuit', () => {
    it('skips init entirely when STORAGE_DRIVER != gcs (no env vars required)', () => {
      const config = makeConfig({
        storageDriver: StorageDriver.Local,
        gcsProjectId: undefined,
        gcsBucketName: undefined,
      });
      const driver = new GcsStorageDriver(config);

      expect(() => driver.onModuleInit()).not.toThrow();
      expect(MockStorage).not.toHaveBeenCalled();
    });
  });

  describe('onModuleInit — gcs mode validation', () => {
    it('throws GCS_CONFIG_MISSING when projectId is unset', () => {
      const driver = new GcsStorageDriver(
        makeConfig({ gcsProjectId: undefined }),
      );
      try {
        driver.onModuleInit();
        fail('expected onModuleInit to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(InfrastructureException);
        expect((e as InfrastructureException).code).toBe('GCS_CONFIG_MISSING');
      }
    });

    it('throws GCS_CONFIG_MISSING when bucket is unset', () => {
      const driver = new GcsStorageDriver(
        makeConfig({ gcsBucketName: undefined }),
      );
      expect(() => driver.onModuleInit()).toThrow(InfrastructureException);
    });

    it('initialises Storage with projectId only when service account key is unset (ADC)', () => {
      mockStorageImpl();
      const driver = new GcsStorageDriver(makeConfig({ gcsServiceAccountKey: undefined }));
      driver.onModuleInit();

      expect(MockStorage).toHaveBeenCalledTimes(1);
      expect(MockStorage).toHaveBeenCalledWith({ projectId: 'test-project' });
    });
  });

  describe('credential resolution', () => {
    const fakeServiceAccount = {
      type: 'service_account',
      project_id: 'test-project',
      client_email: 'sa@test-project.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n',
    };

    it('treats valid base64 JSON as an inline credential', () => {
      const base64 = Buffer.from(JSON.stringify(fakeServiceAccount)).toString('base64');
      mockStorageImpl();
      const driver = new GcsStorageDriver(makeConfig({ gcsServiceAccountKey: base64 }));
      driver.onModuleInit();

      expect(MockStorage).toHaveBeenCalledWith({
        projectId: 'test-project',
        credentials: expect.objectContaining({
          client_email: 'sa@test-project.iam.gserviceaccount.com',
        }),
      });
    });

    it('treats a non-base64 string as a filesystem path (keyFilename)', () => {
      mockStorageImpl();
      const driver = new GcsStorageDriver(
        makeConfig({ gcsServiceAccountKey: '/path/to/key.json' }),
      );
      driver.onModuleInit();

      expect(MockStorage).toHaveBeenCalledWith({
        projectId: 'test-project',
        keyFilename: '/path/to/key.json',
      });
    });

    it('falls back to keyFilename when base64 decodes but isnt a service account JSON', () => {
      // Looks like base64, decodes to JSON, but missing client_email.
      const base64 = Buffer.from(JSON.stringify({ not: 'a-service-account' })).toString(
        'base64',
      );
      mockStorageImpl();
      const driver = new GcsStorageDriver(makeConfig({ gcsServiceAccountKey: base64 }));
      driver.onModuleInit();

      expect(MockStorage).toHaveBeenCalledWith({
        projectId: 'test-project',
        keyFilename: base64,
      });
    });
  });

  describe('generateUploadUrl', () => {
    // Architecture (2026-05-14): backend-proxied uploads. Both drivers
    // return the same backend route; the difference (FS vs GCS) lives
    // inside writeStream. Presigned-URL minting is retained as a private
    // capability but not used by the port contract.
    it('returns the backend raw-PUT URL (no presigned URL minted)', async () => {
      const mocks = mockStorageImpl();
      const driver = new GcsStorageDriver(makeConfig());
      driver.onModuleInit();

      const documentId = DocumentId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
      const type = DocumentType.fromValue('PDF');
      const key = StorageKey.forDocument(documentId, type);

      const grant = await driver.generateUploadUrl(key, type);

      expect(grant.url).toBe(
        '/api/v1/documents/upload/raw/5a0eef1d-4433-454e-a1a5-7ca51bf48955.pdf',
      );
      expect(grant.method).toBe('PUT');
      expect(grant.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // No SDK call should have been made — the URL is constructed locally.
      expect(mocks.getSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('writeStream', () => {
    function uploadKey(): StorageKey {
      const id = DocumentId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
      return StorageKey.forDocument(id, DocumentType.fromValue('PDF'));
    }

    it('streams source bytes to GCS via createWriteStream', async () => {
      const sink = new PassThrough();
      const chunks: Buffer[] = [];
      sink.on('data', (c: Buffer) => chunks.push(c));

      const mocks = mockStorageImpl({ writeSink: sink });
      const driver = new GcsStorageDriver(makeConfig());
      driver.onModuleInit();

      const payload = Buffer.from('%PDF-1.4\nhello\n%EOF\n', 'utf8');
      const source = Readable.from([payload]);

      const result = await driver.writeStream(uploadKey(), source, 'application/pdf');

      expect(result.bytesWritten).toBe(payload.length);
      expect(Buffer.concat(chunks).toString()).toBe(payload.toString());

      // SDK was asked for a non-resumable upload with the right content type.
      expect(mocks.createWriteStream).toHaveBeenCalledWith(
        expect.objectContaining({
          resumable: false,
          metadata: expect.objectContaining({ contentType: 'application/pdf' }),
        }),
      );
    });

    it('wraps SDK write errors in InfrastructureException and cleans up the half-written file', async () => {
      // A Writable that errors on first write — simulates GCS rejecting the upload.
      const failingSink = new Writable({
        write(_chunk, _enc, cb) {
          cb(new Error('GCS write boom'));
        },
      });
      const deleteFn = jest.fn().mockResolvedValue(undefined);
      mockStorageImpl({ writeSink: failingSink, deleteImpl: deleteFn });

      const driver = new GcsStorageDriver(makeConfig());
      driver.onModuleInit();
      const source = Readable.from([Buffer.from('payload')]);

      await expect(
        driver.writeStream(uploadKey(), source, 'application/pdf'),
      ).rejects.toMatchObject({
        constructor: InfrastructureException,
        code: 'STORAGE_WRITE_FAILED',
      });

      // Half-written object should be deleted (best-effort cleanup).
      expect(deleteFn).toHaveBeenCalled();
    });

    it('omits contentType metadata when not provided', async () => {
      const sink = new PassThrough();
      const mocks = mockStorageImpl({ writeSink: sink });
      const driver = new GcsStorageDriver(makeConfig());
      driver.onModuleInit();

      const source = Readable.from([Buffer.from('x')]);
      await driver.writeStream(uploadKey(), source);

      const call = mocks.createWriteStream.mock.calls[0][0];
      expect(call.metadata).toBeUndefined();
      expect(call.resumable).toBe(false);
    });
  });

  describe('exists', () => {
    it('returns true when the SDK reports the file exists', async () => {
      mockStorageImpl({ exists: true });
      const driver = new GcsStorageDriver(makeConfig());
      driver.onModuleInit();

      const id = DocumentId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
      const type = DocumentType.fromValue('PDF');
      expect(await driver.exists(StorageKey.forDocument(id, type))).toBe(true);
    });

    it('returns false when the SDK reports the file is missing', async () => {
      mockStorageImpl({ exists: false });
      const driver = new GcsStorageDriver(makeConfig());
      driver.onModuleInit();

      const id = DocumentId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
      const type = DocumentType.fromValue('PDF');
      expect(await driver.exists(StorageKey.forDocument(id, type))).toBe(false);
    });
  });
});
