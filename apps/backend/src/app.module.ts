import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from './config/app-config.module';
import { LoggerModule } from './shared/infrastructure/logging/logger.module';
import { ResponseInterceptor } from './shared/infrastructure/interceptors/response.interceptor';

@Module({
  imports: [AppConfigModule, LoggerModule, CqrsModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
