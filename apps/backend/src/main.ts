// Side-effect import — MUST be first. Forces gaxios (GCS / google-auth) to
// use native fetch instead of node-fetch, which throws
// ERR_STREAM_PREMATURE_CLOSE on Node 22 and breaks GCS uploads. See the
// patch file for the full rationale.
import './shared/infrastructure/http/gaxios-native-fetch.patch';

import { NestFactory } from '@nestjs/core';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/exceptions/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  // The MCP server (Phase 12) is served at a clean `/mcp` URL — excluded
  // from the api/v1 prefix so the agent runtimes / vault config point at a
  // stable transport URL, not a versioned REST path.
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1', {
    exclude: [{ path: 'mcp', method: RequestMethod.ALL }],
  });

  const config = new DocumentBuilder()
    .setTitle('Contract Analysis Platform API')
    .setDescription('AI-powered contract analysis and due diligence platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err: Error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Bootstrap failed', err.stack);
  process.exit(1);
});
