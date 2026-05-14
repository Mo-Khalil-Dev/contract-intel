import { Storage } from '@google-cloud/storage';
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
}: { signedUrl?: string; exists?: boolean } = {}) {
  const getSignedUrl = jest.fn().mockResolvedValue([signedUrl]);
  const existsFn = jest.fn().mockResolvedValue([exists]);
  const file = jest.fn().mockReturnValue({ getSignedUrl, exists: existsFn });
  const bucket = jest.fn().mockReturnValue({ file });
  MockStorage.mockImplementation(() => ({ bucket }) as unknown as Storage);
  return { bucket, file, getSignedUrl, existsFn };
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
    it('mints a V4 presigned PUT URL with PDF content type', async () => {
      const mocks = mockStorageImpl({
        signedUrl: 'https://storage.googleapis.com/test-bucket/abc.pdf?sig=...',
      });
      const driver = new GcsStorageDriver(makeConfig());
      driver.onModuleInit();

      const documentId = DocumentId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
      const type = DocumentType.fromValue('PDF');
      const key = StorageKey.forDocument(documentId, type);

      const grant = await driver.generateUploadUrl(key, type);

      expect(grant.url).toBe('https://storage.googleapis.com/test-bucket/abc.pdf?sig=...');
      expect(grant.method).toBe('PUT');
      expect(grant.expiresAt.getTime()).toBeGreaterThan(Date.now());

      expect(mocks.bucket).toHaveBeenCalledWith('test-bucket');
      expect(mocks.file).toHaveBeenCalledWith(key.value);
      expect(mocks.getSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 'v4',
          action: 'write',
          contentType: 'application/pdf',
        }),
      );
    });

    it('wraps SDK errors in InfrastructureException', async () => {
      mockStorageImpl();
      MockStorage.mockImplementation(
        () =>
          ({
            bucket: () => ({
              file: () => ({
                getSignedUrl: jest.fn().mockRejectedValue(new Error('SDK boom')),
              }),
            }),
          }) as unknown as Storage,
      );

      const driver = new GcsStorageDriver(makeConfig());
      driver.onModuleInit();

      const id = DocumentId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
      const type = DocumentType.fromValue('PDF');

      try {
        await driver.generateUploadUrl(StorageKey.forDocument(id, type), type);
        fail('expected generateUploadUrl to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(InfrastructureException);
        expect((e as InfrastructureException).code).toBe('GCS_PRESIGN_FAILED');
        expect((e as InfrastructureException).message).toContain('SDK boom');
      }
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
