import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { AppConfigModule } from '../../config/app-config.module';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { InitiateUploadHandler } from './application/commands/initiate-upload.handler';
import { CompleteUploadHandler } from './application/commands/complete-upload.handler';
import { FailUploadHandler } from './application/commands/fail-upload.handler';
import { GetUploadStatusHandler } from './application/queries/get-upload-status.handler';
import { DOCUMENT_REPOSITORY } from './domain/document.repository';
import { STORAGE_SERVICE } from './domain/ports/storage-service.port';
import { DocumentController } from './infrastructure/document.controller';
import { PrismaDocumentRepository } from './infrastructure/prisma-document.repository';
import { LocalStorageDriver } from './infrastructure/storage/local-storage.driver';

/**
 * Documents module — Phase 5.
 *
 * v1 storage: LocalStorageDriver bound to the IStorageService port.
 * GcsStorageDriver lands in Task 5.4b; this module will then read
 * AppConfigService.storageDriver and choose between them via a factory.
 */
@Module({
  imports: [CqrsModule, AuthModule, AppConfigModule, PrismaModule],
  controllers: [DocumentController],
  providers: [
    // Application
    InitiateUploadHandler,
    CompleteUploadHandler,
    FailUploadHandler,
    GetUploadStatusHandler,

    // Infrastructure
    LocalStorageDriver,
    { provide: DOCUMENT_REPOSITORY, useClass: PrismaDocumentRepository },
    { provide: STORAGE_SERVICE, useExisting: LocalStorageDriver },
  ],
})
export class DocumentsModule {}
