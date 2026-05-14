import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from './config/app-config.module';
import { LoggerModule } from './shared/infrastructure/logging/logger.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { ResponseInterceptor } from './shared/infrastructure/interceptors/response.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module';
import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    CqrsModule,
    AuthModule,
    ReferenceDataModule,
    DocumentsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
