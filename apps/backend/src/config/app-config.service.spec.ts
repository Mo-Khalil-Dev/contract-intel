import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app-config.service';
import { LogLevel, NodeEnv, OcrDriver, QueueDriver, StorageDriver } from './environment-variables';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let mockConfigService: jest.Mocked<ConfigService>;

  const buildConfig = (overrides: Record<string, unknown> = {}) => ({
    NODE_ENV: NodeEnv.Development,
    PORT: 3000,
    API_PREFIX: 'api/v1',
    SESSION_SECRET: 'a-valid-session-secret-of-32-chars-long',
    AUTH0_DOMAIN: 'example.auth0.com',
    AUTH0_CLIENT_ID: 'client-id',
    AUTH0_CLIENT_SECRET: 'client-secret',
    AUTH0_CALLBACK_URL: 'http://localhost:3000/api/v1/auth/callback',
    FRONTEND_URL: 'http://localhost:5173',
    STORAGE_DRIVER: StorageDriver.Local,
    LOCAL_STORAGE_PATH: './uploads',
    OCR_DRIVER: OcrDriver.Mock,
    CLAUDE_API_KEY: 'sk-ant-key',
    QUEUE_DRIVER: QueueDriver.Memory,
    LOG_LEVEL: LogLevel.Debug,
    CORS_ORIGIN: 'http://localhost:5173',
    ...overrides,
  });

  const setupService = async (config: Record<string, unknown>) => {
    mockConfigService = {
      get: jest.fn((key: string) => config[key]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AppConfigService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  };

  describe('Server configuration', () => {
    it('should return NODE_ENV', async () => {
      await setupService(buildConfig({ NODE_ENV: NodeEnv.Production }));
      expect(service.nodeEnv).toBe(NodeEnv.Production);
    });

    it('should return PORT', async () => {
      await setupService(buildConfig({ PORT: 8080 }));
      expect(service.port).toBe(8080);
    });

    it('should return API_PREFIX', async () => {
      await setupService(buildConfig({ API_PREFIX: 'api/v2' }));
      expect(service.apiPrefix).toBe('api/v2');
    });

    it('should return SESSION_SECRET', async () => {
      const secret = 'a-different-secret-that-is-long-enough-x';
      await setupService(buildConfig({ SESSION_SECRET: secret }));
      expect(service.sessionSecret).toBe(secret);
    });
  });

  describe('environment helpers', () => {
    it('should report isDevelopment when NODE_ENV is development', async () => {
      await setupService(buildConfig({ NODE_ENV: NodeEnv.Development }));
      expect(service.isDevelopment).toBe(true);
      expect(service.isProduction).toBe(false);
      expect(service.isTest).toBe(false);
    });

    it('should report isProduction when NODE_ENV is production', async () => {
      await setupService(buildConfig({ NODE_ENV: NodeEnv.Production }));
      expect(service.isDevelopment).toBe(false);
      expect(service.isProduction).toBe(true);
      expect(service.isTest).toBe(false);
    });

    it('should report isTest when NODE_ENV is test', async () => {
      await setupService(buildConfig({ NODE_ENV: NodeEnv.Test }));
      expect(service.isDevelopment).toBe(false);
      expect(service.isProduction).toBe(false);
      expect(service.isTest).toBe(true);
    });
  });

  describe('Auth0 configuration', () => {
    it('should return AUTH0_DOMAIN', async () => {
      await setupService(buildConfig({ AUTH0_DOMAIN: 'mycompany.auth0.com' }));
      expect(service.auth0Domain).toBe('mycompany.auth0.com');
    });

    it('should return AUTH0_CLIENT_ID', async () => {
      await setupService(buildConfig({ AUTH0_CLIENT_ID: 'my-client-id' }));
      expect(service.auth0ClientId).toBe('my-client-id');
    });

    it('should return AUTH0_CLIENT_SECRET', async () => {
      await setupService(buildConfig({ AUTH0_CLIENT_SECRET: 'super-secret' }));
      expect(service.auth0ClientSecret).toBe('super-secret');
    });

    it('should return AUTH0_CALLBACK_URL', async () => {
      const url = 'https://app.example.com/api/v1/auth/callback';
      await setupService(buildConfig({ AUTH0_CALLBACK_URL: url }));
      expect(service.auth0CallbackUrl).toBe(url);
    });

    it('should return undefined for optional Auth0 vars in development', async () => {
      await setupService(
        buildConfig({
          AUTH0_DOMAIN: undefined,
          AUTH0_CLIENT_ID: undefined,
          AUTH0_CLIENT_SECRET: undefined,
        }),
      );
      expect(service.auth0Domain).toBeUndefined();
      expect(service.auth0ClientId).toBeUndefined();
      expect(service.auth0ClientSecret).toBeUndefined();
    });
  });

  describe('Frontend configuration', () => {
    it('should return FRONTEND_URL', async () => {
      const url = 'https://app.example.com';
      await setupService(buildConfig({ FRONTEND_URL: url }));
      expect(service.frontendUrl).toBe(url);
    });
  });

  describe('Storage configuration', () => {
    it('should return STORAGE_DRIVER as enum', async () => {
      await setupService(buildConfig({ STORAGE_DRIVER: StorageDriver.Gcs }));
      expect(service.storageDriver).toBe(StorageDriver.Gcs);
    });

    it('should return LOCAL_STORAGE_PATH', async () => {
      await setupService(buildConfig({ LOCAL_STORAGE_PATH: '/var/uploads' }));
      expect(service.localStoragePath).toBe('/var/uploads');
    });
  });

  describe('OCR configuration', () => {
    it('should return OCR_DRIVER as enum', async () => {
      await setupService(buildConfig({ OCR_DRIVER: OcrDriver.GoogleDocumentAi }));
      expect(service.ocrDriver).toBe(OcrDriver.GoogleDocumentAi);
    });
  });

  describe('AI configuration', () => {
    it('should return CLAUDE_API_KEY', async () => {
      await setupService(buildConfig({ CLAUDE_API_KEY: 'sk-ant-12345' }));
      expect(service.claudeApiKey).toBe('sk-ant-12345');
    });

    it('should return undefined when CLAUDE_API_KEY is missing', async () => {
      await setupService(buildConfig({ CLAUDE_API_KEY: undefined }));
      expect(service.claudeApiKey).toBeUndefined();
    });
  });

  describe('Queue configuration', () => {
    it('should return QUEUE_DRIVER as enum', async () => {
      await setupService(buildConfig({ QUEUE_DRIVER: QueueDriver.Bullmq }));
      expect(service.queueDriver).toBe(QueueDriver.Bullmq);
    });
  });

  describe('Logging configuration', () => {
    it('should return LOG_LEVEL as enum', async () => {
      await setupService(buildConfig({ LOG_LEVEL: LogLevel.Error }));
      expect(service.logLevel).toBe(LogLevel.Error);
    });
  });

  describe('CORS configuration', () => {
    it('should return CORS_ORIGIN', async () => {
      const origin = 'https://app.example.com';
      await setupService(buildConfig({ CORS_ORIGIN: origin }));
      expect(service.corsOrigin).toBe(origin);
    });
  });

  describe('infer mode usage', () => {
    it('should call ConfigService.get with infer option for typed access', async () => {
      await setupService(buildConfig());

      service.nodeEnv;
      service.port;
      service.sessionSecret;

      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV', {
        infer: true,
      });
      expect(mockConfigService.get).toHaveBeenCalledWith('PORT', {
        infer: true,
      });
      expect(mockConfigService.get).toHaveBeenCalledWith('SESSION_SECRET', {
        infer: true,
      });
    });
  });
});
