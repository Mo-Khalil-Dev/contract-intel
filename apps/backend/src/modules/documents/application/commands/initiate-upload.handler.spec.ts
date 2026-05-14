import { EventBus } from '@nestjs/cqrs';
import { InitiateUploadHandler } from './initiate-upload.handler';
import { InitiateUploadCommand } from './initiate-upload.command';
import { IDocumentRepository } from '../../domain/document.repository';
import { IStorageService } from '../../domain/ports/storage-service.port';
import { DomainException } from '../../../../shared/exceptions/app-error';

const VALID_USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';

function fakeStorage(): jest.Mocked<IStorageService> {
  return {
    generateUploadUrl: jest.fn().mockResolvedValue({
      url: 'http://storage.example/abc.pdf',
      expiresAt: new Date('2026-05-14T11:00:00Z'),
      method: 'PUT',
    }),
  };
}

function fakeRepo(): jest.Mocked<IDocumentRepository> {
  return {
    findByIdForOrg: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

function fakeBus(): jest.Mocked<EventBus> {
  return { publishAll: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

describe('InitiateUploadHandler', () => {
  it('persists a Document and returns the upload URL', async () => {
    const repo = fakeRepo();
    const storage = fakeStorage();
    const bus = fakeBus();
    const handler = new InitiateUploadHandler(repo, storage, bus);

    const result = await handler.execute(
      new InitiateUploadCommand(
        'acme-vendor-agreement.pdf',
        1_500_000,
        'application/pdf',
        VALID_USER_ID,
      ),
    );

    expect(result.documentId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.uploadUrl).toBe('http://storage.example/abc.pdf');
    expect(result.method).toBe('PUT');

    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved = repo.save.mock.calls[0][0];
    expect(saved.name.value).toBe('acme-vendor-agreement.pdf');
    expect(saved.size.bytes).toBe(1_500_000);
    expect(saved.orgId.value).toBe(VALID_USER_ID);

    // Storage was asked for a URL with the document's storage key.
    expect(storage.generateUploadUrl).toHaveBeenCalledTimes(1);
    expect(storage.generateUploadUrl.mock.calls[0][0].value).toMatch(/^[0-9a-f-]{36}\.pdf$/);

    // Domain event was published after save.
    expect(bus.publishAll).toHaveBeenCalledTimes(1);
    const events = bus.publishAll.mock.calls[0][0] as unknown[];
    expect(events.length).toBeGreaterThan(0);
  });

  it('rejects unsupported MIME types before touching the repo', async () => {
    const repo = fakeRepo();
    const storage = fakeStorage();
    const handler = new InitiateUploadHandler(repo, storage, fakeBus());

    await expect(
      handler.execute(
        new InitiateUploadCommand('contract.docx', 10_000, 'application/msword', VALID_USER_ID),
      ),
    ).rejects.toBeInstanceOf(DomainException);

    expect(repo.save).not.toHaveBeenCalled();
    expect(storage.generateUploadUrl).not.toHaveBeenCalled();
  });

  it('rejects files larger than 50 MB before touching storage', async () => {
    const repo = fakeRepo();
    const storage = fakeStorage();
    const handler = new InitiateUploadHandler(repo, storage, fakeBus());

    await expect(
      handler.execute(
        new InitiateUploadCommand(
          'huge.pdf',
          51 * 1024 * 1024,
          'application/pdf',
          VALID_USER_ID,
        ),
      ),
    ).rejects.toBeInstanceOf(DomainException);

    expect(repo.save).not.toHaveBeenCalled();
    expect(storage.generateUploadUrl).not.toHaveBeenCalled();
  });

  it('rejects non-UUID requesterUserId', async () => {
    const handler = new InitiateUploadHandler(fakeRepo(), fakeStorage(), fakeBus());
    await expect(
      handler.execute(
        new InitiateUploadCommand('a.pdf', 100, 'application/pdf', 'not-a-uuid'),
      ),
    ).rejects.toBeInstanceOf(DomainException);
  });
});
