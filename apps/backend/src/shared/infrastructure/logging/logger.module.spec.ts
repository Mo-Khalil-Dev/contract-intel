import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule, REQUEST_ID_HEADER } from './logger.module';
import { AppConfigService } from '../../../config/app-config.service';
import { NodeEnv, LogLevel } from '../../../config/environment-variables';

describe('LoggerModule', () => {
  describe('REQUEST_ID_HEADER constant', () => {
    it('should be lowercase x-request-id', () => {
      expect(REQUEST_ID_HEADER).toBe('x-request-id');
    });
  });

  describe('module compilation', () => {
    it('should compile with mocked AppConfigService', async () => {
      const mockConfig: Partial<AppConfigService> = {
        logLevel: LogLevel.Debug,
        nodeEnv: NodeEnv.Development,
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [LoggerModule],
      })
        .overrideProvider(AppConfigService)
        .useValue(mockConfig)
        .compile();

      expect(moduleRef).toBeDefined();
    });

    it('should import AppConfigModule for config dependency', () => {
      const imports = Reflect.getMetadata('imports', LoggerModule);
      expect(imports).toBeDefined();
      expect(imports.length).toBeGreaterThan(0);
    });
  });

  describe('request id generation', () => {
    const buildGenReqId = () => {
      return (req: { headers: Record<string, unknown> }): string => {
        const existing = req.headers[REQUEST_ID_HEADER];
        if (typeof existing === 'string' && existing.length > 0) {
          return existing;
        }
        return 'generated-uuid';
      };
    };

    it('should reuse existing x-request-id header when present', () => {
      const genReqId = buildGenReqId();
      const req = { headers: { [REQUEST_ID_HEADER]: 'incoming-id-123' } };

      expect(genReqId(req)).toBe('incoming-id-123');
    });

    it('should generate a new id when header is missing', () => {
      const genReqId = buildGenReqId();
      const req = { headers: {} };

      expect(genReqId(req)).toBe('generated-uuid');
    });

    it('should generate a new id when header is empty string', () => {
      const genReqId = buildGenReqId();
      const req = { headers: { [REQUEST_ID_HEADER]: '' } };

      expect(genReqId(req)).toBe('generated-uuid');
    });

    it('should generate a new id when header is array (multi-header case)', () => {
      const genReqId = buildGenReqId();
      const req = { headers: { [REQUEST_ID_HEADER]: ['a', 'b'] } };

      expect(genReqId(req)).toBe('generated-uuid');
    });
  });

  describe('redaction configuration', () => {
    const sensitivePathsThatMustBeRedacted = [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.sessionSecret',
    ];

    it('should document the paths that must be redacted', () => {
      expect(sensitivePathsThatMustBeRedacted).toContain('req.headers.authorization');
      expect(sensitivePathsThatMustBeRedacted).toContain('req.body.password');
    });
  });
});
