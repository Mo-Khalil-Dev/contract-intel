import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { v4 as uuid } from 'uuid';
import { IncomingMessage, ServerResponse } from 'http';
import { AppConfigService } from '../../../config/app-config.service';
import { AppConfigModule } from '../../../config/app-config.module';
import { NodeEnv } from '../../../config/environment-variables';

export const REQUEST_ID_HEADER = 'x-request-id';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.logLevel,
          genReqId: (req: IncomingMessage) => {
            const existing = req.headers[REQUEST_ID_HEADER];
            if (typeof existing === 'string' && existing.length > 0) {
              return existing;
            }
            return uuid();
          },
          customProps: (req: IncomingMessage) => ({
            requestId: (req as IncomingMessage & { id?: string }).id,
          }),
          serializers: {
            req: (req: IncomingMessage & { id?: string }) => ({
              id: req.id,
              method: req.method,
              url: req.url,
            }),
            res: (res: ServerResponse) => ({
              statusCode: res.statusCode,
            }),
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.token',
              'req.body.sessionSecret',
            ],
            censor: '[REDACTED]',
          },
          transport:
            config.nodeEnv === NodeEnv.Development
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
        },
      }),
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
