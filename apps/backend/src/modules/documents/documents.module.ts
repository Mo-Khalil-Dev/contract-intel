import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { StorageDriver } from '../../config/environment-variables';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { InitiateUploadHandler } from './application/commands/initiate-upload.handler';
import { CompleteUploadHandler } from './application/commands/complete-upload.handler';
import { FailUploadHandler } from './application/commands/fail-upload.handler';
import { GetUploadStatusHandler } from './application/queries/get-upload-status.handler';
import { DOCUMENT_REPOSITORY } from './domain/document.repository';
import { STORAGE_SERVICE, IStorageService } from './domain/ports/storage-service.port';
import { DocumentController } from './infrastructure/document.controller';
import { PrismaDocumentRepository } from './infrastructure/prisma-document.repository';
import { LocalStorageDriver } from './infrastructure/storage/local-storage.driver';
import { GcsStorageDriver } from './infrastructure/storage/gcs-storage.driver';

/**
 * Documents module — Phase 5.
 *
 * Storage driver is chosen at boot based on AppConfigService.storageDriver
 * (env var STORAGE_DRIVER):
 *   - 'local' → LocalStorageDriver writes to LOCAL_STORAGE_PATH. The
 *     DocumentController.raw route streams body bytes to disk.
 *   - 'gcs'   → GcsStorageDriver mints V4 presigned URLs; browser PUTs
 *     directly to googleapis.com and the backend never sees the bytes.
 *
 * Both drivers are registered as providers; the factory picks one and
 * binds it to the IStorageService port. The DocumentController always
 * injects the concrete LocalStorageDriver for its raw PUT route, but
 * that route is never hit in gcs mode (browser PUTs elsewhere).
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
    GcsStorageDriver,
    { provide: DOCUMENT_REPOSITORY, useClass: PrismaDocumentRepository },
    {
      provide: STORAGE_SERVICE,
      inject: [AppConfigService, LocalStorageDriver, GcsStorageDriver],
      useFactory: (
        config: AppConfigService,
        local: LocalStorageDriver,
        gcs: GcsStorageDriver,
      ): IStorageService =>
        config.storageDriver === StorageDriver.Gcs ? gcs : local,
    },
  ],
})
export class DocumentsModule {}
