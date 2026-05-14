import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DocumentController } from '../src/modules/documents/infrastructure/document.controller';
import { LocalStorageDriver } from '../src/modules/documents/infrastructure/storage/local-storage.driver';
import { ResponseInterceptor } from '../src/shared/infrastructure/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/shared/exceptions/http-exception.filter';
import { AppConfigService } from '../src/config/app-config.service';
import { InitiateUploadCommand } from '../src/modules/documents/application/commands/initiate-upload.command';
import { CompleteUploadCommand } from '../src/modules/documents/application/commands/complete-upload.command';
import { GetUploadStatusQuery } from '../src/modules/documents/application/queries/get-upload-status.query';

/**
 * E2E for the full upload flow against the LocalStorageDriver.
 *
 * Auth is sidestepped — the controller is mounted standalone without
 * SessionAuthGuard, with CommandBus/QueryBus mocked at the bus boundary.
 * The raw PUT route is exercised against a real LocalStorageDriver
 * pointed at a temp dir so we verify bytes actually land on disk.
 */
describe('Documents E2E (upload flow)', () => {
  let app: any;
  let uploadsDir: string;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };

  beforeAll(async () => {
    uploadsDir = await fs.mkdtemp(join(tmpdir(), 'ci-upload-e2e-'));

    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        {
          provide: AppConfigService,
          useValue: { localStoragePath: uploadsDir } as Partial<AppConfigService>,
        },
        LocalStorageDriver,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    // Mirror main.ts: class-validator decorators on DTOs need this pipe
    // to fire, otherwise invalid bodies sail through to the handler.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );

    // Inject a stub user — the @CurrentUser decorator reads request.user.
    app.use((req: any, _res: any, next: any) => {
      req.user = {
        userId: '11111111-2222-4333-8444-555555555555',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await fs.rm(uploadsDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    commandBus.execute.mockReset();
    queryBus.execute.mockReset();
  });

  describe('Full flow', () => {
    const documentId = '11111111-2222-4333-8444-555555555556';
    const storageKey = `${documentId}.pdf`;
    const pdfBytes = Buffer.from('%PDF-1.4\nTest content\n%EOF\n', 'utf8');

    it('1. POST /upload/initiate returns documentId + uploadUrl', async () => {
      commandBus.execute.mockResolvedValueOnce({
        documentId,
        uploadUrl: `/api/v1/documents/upload/raw/${storageKey}`,
        method: 'PUT' as const,
        expiresAt: new Date('2026-05-14T20:00:00Z'),
      });

      const response = await request(app.getHttpServer())
        .post('/documents/upload/initiate')
        .send({ fileName: 'test.pdf', fileSize: pdfBytes.length, fileType: 'application/pdf' })
        .expect(201); // Nest's default for POST

      expect(response.body.data).toEqual(
        expect.objectContaining({ documentId, method: 'PUT' }),
      );
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(InitiateUploadCommand),
      );
    });

    it('2. PUT /upload/raw/:key streams body to disk', async () => {
      await request(app.getHttpServer())
        .put(`/documents/upload/raw/${storageKey}`)
        .set('Content-Type', 'application/pdf')
        .send(pdfBytes)
        .expect(204);

      const written = await fs.readFile(join(uploadsDir, storageKey));
      expect(written.toString()).toBe(pdfBytes.toString());
    });

    it('3. POST /upload/complete transitions the document', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);

      await request(app.getHttpServer())
        .post('/documents/upload/complete')
        .send({ documentId })
        .expect(204);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CompleteUploadCommand),
      );
    });

    it('4. GET /:id/status returns the status view', async () => {
      queryBus.execute.mockResolvedValueOnce({
        documentId,
        status: 'complete' as const,
        uploadedAt: '2026-05-14T19:00:00.000Z',
        failureReason: null,
      });

      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}/status`)
        .expect(200);

      expect(response.body.data).toEqual({
        documentId,
        status: 'complete',
        uploadedAt: '2026-05-14T19:00:00.000Z',
        failureReason: null,
      });
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetUploadStatusQuery));
    });
  });

  describe('Input validation (initiate)', () => {
    it('rejects payload missing fileName', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents/upload/initiate')
        .send({ fileSize: 1000, fileType: 'application/pdf' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('rejects fileSize above the 50 MB limit', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents/upload/initiate')
        .send({
          fileName: 'huge.pdf',
          fileSize: 100 * 1024 * 1024,
          fileType: 'application/pdf',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('rejects fileSize of 0', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload/initiate')
        .send({ fileName: 'a.pdf', fileSize: 0, fileType: 'application/pdf' })
        .expect(400);
    });
  });

  describe('Path-traversal guard on raw PUT', () => {
    it('rejects a malformed storage key', async () => {
      // The StorageKey VO requires `{uuid}.{ext}` and rejects anything with
      // path separators or no extension.
      await request(app.getHttpServer())
        .put('/documents/upload/raw/' + encodeURIComponent('../etc/passwd'))
        .set('Content-Type', 'application/pdf')
        .send(Buffer.from('x'))
        .expect(422);
    });
  });
});
