import {
  validateEnvironment,
  NodeEnv,
  StorageDriver,
  OcrDriver,
  QueueDriver,
  LogLevel,
} from './environment-variables';

describe('validateEnvironment', () => {
  const validConfig = {
    NODE_ENV: 'development',
    PORT: '3000',
    API_PREFIX: 'api/v1',
    SESSION_SECRET: 'a-valid-session-secret-of-32-chars-long',
    DATABASE_URL: 'file:./test.db',
    ENCRYPTION_KEY: 'a-valid-encryption-key-of-32-chars-long-x',
    ENCRYPTION_KEY_NAME: 'primary',
    FRONTEND_URL: 'http://localhost:5173',
    STORAGE_DRIVER: 'local',
    LOCAL_STORAGE_PATH: './uploads',
    OCR_DRIVER: 'mock',
    QUEUE_DRIVER: 'memory',
    LOG_LEVEL: 'debug',
    CORS_ORIGIN: 'http://localhost:5173',
  };

  describe('valid configuration', () => {
    it('should accept a complete valid config', () => {
      expect(() => validateEnvironment(validConfig)).not.toThrow();
    });

    it('should return a typed EnvironmentVariables instance', () => {
      const result = validateEnvironment(validConfig);

      expect(result.NODE_ENV).toBe(NodeEnv.Development);
      expect(result.PORT).toBe(3000);
      expect(result.SESSION_SECRET).toBe(validConfig.SESSION_SECRET);
    });

    it('should convert string PORT to integer', () => {
      const result = validateEnvironment({
        ...validConfig,
        PORT: '8080',
      });

      expect(result.PORT).toBe(8080);
      expect(typeof result.PORT).toBe('number');
    });

    it('should apply defaults for optional fields', () => {
      const minimalConfig = {
        SESSION_SECRET: 'a-valid-session-secret-of-32-chars-long',
        ENCRYPTION_KEY: 'a-valid-encryption-key-of-32-chars-long-x',
      };

      const result = validateEnvironment(minimalConfig);

      expect(result.NODE_ENV).toBe(NodeEnv.Development);
      expect(result.PORT).toBe(3000);
      expect(result.API_PREFIX).toBe('api/v1');
      expect(result.DATABASE_URL).toBe('file:./dev.db');
      expect(result.ENCRYPTION_KEY_NAME).toBe('primary');
      expect(result.STORAGE_DRIVER).toBe(StorageDriver.Local);
      expect(result.OCR_DRIVER).toBe(OcrDriver.Mock);
      expect(result.QUEUE_DRIVER).toBe(QueueDriver.Memory);
      expect(result.LOG_LEVEL).toBe(LogLevel.Debug);
    });
  });

  describe('SESSION_SECRET validation', () => {
    it('should reject SESSION_SECRET shorter than 32 characters', () => {
      expect(() =>
        validateEnvironment({
          ...validConfig,
          SESSION_SECRET: 'too-short',
        }),
      ).toThrow(/SESSION_SECRET/);
    });

    it('should reject empty SESSION_SECRET', () => {
      expect(() =>
        validateEnvironment({
          ...validConfig,
          SESSION_SECRET: '',
        }),
      ).toThrow();
    });

    it('should reject missing SESSION_SECRET', () => {
      const { SESSION_SECRET: _unused, ...configWithout } = validConfig;

      expect(() => validateEnvironment(configWithout)).toThrow();
    });

    it('should accept SESSION_SECRET with exactly 32 characters', () => {
      const result = validateEnvironment({
        ...validConfig,
        SESSION_SECRET: 'a'.repeat(32),
      });

      expect(result.SESSION_SECRET).toHaveLength(32);
    });

    it('should accept SESSION_SECRET longer than 32 characters', () => {
      const longSecret = 'a'.repeat(100);
      const result = validateEnvironment({
        ...validConfig,
        SESSION_SECRET: longSecret,
      });

      expect(result.SESSION_SECRET).toBe(longSecret);
    });
  });

  describe('ENCRYPTION_KEY validation', () => {
    it('should reject ENCRYPTION_KEY shorter than 32 characters', () => {
      expect(() =>
        validateEnvironment({
          ...validConfig,
          ENCRYPTION_KEY: 'short',
        }),
      ).toThrow(/ENCRYPTION_KEY/);
    });

    it('should reject missing ENCRYPTION_KEY', () => {
      const { ENCRYPTION_KEY: _unused, ...configWithout } = validConfig;

      expect(() => validateEnvironment(configWithout)).toThrow();
    });

    it('should default ENCRYPTION_KEY_NAME to "primary"', () => {
      const { ENCRYPTION_KEY_NAME: _unused, ...rest } = validConfig;
      const result = validateEnvironment(rest);

      expect(result.ENCRYPTION_KEY_NAME).toBe('primary');
    });
  });

  describe('DATABASE_URL', () => {
    it('should default to file:./dev.db when not provided', () => {
      const { DATABASE_URL: _unused, ...rest } = validConfig;
      const result = validateEnvironment(rest);

      expect(result.DATABASE_URL).toBe('file:./dev.db');
    });

    it('should accept a postgres URL', () => {
      const result = validateEnvironment({
        ...validConfig,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/contracts',
      });

      expect(result.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/contracts');
    });
  });

  describe('PORT validation', () => {
    it('should reject non-numeric PORT', () => {
      expect(() => validateEnvironment({ ...validConfig, PORT: 'not-a-number' })).toThrow();
    });

    it('should reject PORT less than 1', () => {
      expect(() => validateEnvironment({ ...validConfig, PORT: '0' })).toThrow();
    });

    it('should reject PORT greater than 65535', () => {
      expect(() => validateEnvironment({ ...validConfig, PORT: '70000' })).toThrow();
    });

    it('should accept valid PORT range', () => {
      [1, 80, 3000, 8080, 65535].forEach((port) => {
        const result = validateEnvironment({
          ...validConfig,
          PORT: String(port),
        });
        expect(result.PORT).toBe(port);
      });
    });
  });

  describe('NODE_ENV validation', () => {
    it('should accept development', () => {
      const result = validateEnvironment({
        ...validConfig,
        NODE_ENV: 'development',
      });
      expect(result.NODE_ENV).toBe(NodeEnv.Development);
    });

    it('should accept test', () => {
      const result = validateEnvironment({
        ...validConfig,
        NODE_ENV: 'test',
      });
      expect(result.NODE_ENV).toBe(NodeEnv.Test);
    });

    it('should accept production with all required vars', () => {
      const result = validateEnvironment({
        ...validConfig,
        NODE_ENV: 'production',
        AUTH0_DOMAIN: 'example.auth0.com',
        AUTH0_CLIENT_ID: 'client-id',
        AUTH0_CLIENT_SECRET: 'client-secret',
        AUTH0_CALLBACK_URL: 'https://example.com/callback',
        CLAUDE_API_KEY: 'sk-ant-key',
      });
      expect(result.NODE_ENV).toBe(NodeEnv.Production);
    });

    it('should reject invalid NODE_ENV', () => {
      expect(() => validateEnvironment({ ...validConfig, NODE_ENV: 'staging' })).toThrow();
    });
  });

  describe('production environment validation', () => {
    const productionConfig = {
      ...validConfig,
      NODE_ENV: 'production',
      AUTH0_DOMAIN: 'example.auth0.com',
      AUTH0_CLIENT_ID: 'client-id',
      AUTH0_CLIENT_SECRET: 'client-secret',
      AUTH0_CALLBACK_URL: 'https://example.com/callback',
      CLAUDE_API_KEY: 'sk-ant-key',
    };

    it('should accept production with all required variables', () => {
      expect(() => validateEnvironment(productionConfig)).not.toThrow();
    });

    it('should reject production without AUTH0_DOMAIN', () => {
      const { AUTH0_DOMAIN: _unused, ...rest } = productionConfig;

      expect(() => validateEnvironment(rest)).toThrow(/AUTH0_DOMAIN/);
    });

    it('should reject production without AUTH0_CLIENT_ID', () => {
      const { AUTH0_CLIENT_ID: _unused, ...rest } = productionConfig;

      expect(() => validateEnvironment(rest)).toThrow(/AUTH0_CLIENT_ID/);
    });

    it('should reject production without AUTH0_CLIENT_SECRET', () => {
      const { AUTH0_CLIENT_SECRET: _unused, ...rest } = productionConfig;

      expect(() => validateEnvironment(rest)).toThrow(/AUTH0_CLIENT_SECRET/);
    });

    it('should reject production without CLAUDE_API_KEY', () => {
      const { CLAUDE_API_KEY: _unused, ...rest } = productionConfig;

      expect(() => validateEnvironment(rest)).toThrow(/CLAUDE_API_KEY/);
    });

    it('should list all missing required variables in error message', () => {
      const incompleteConfig = {
        ...validConfig,
        NODE_ENV: 'production',
      };

      expect(() => validateEnvironment(incompleteConfig)).toThrow(
        /AUTH0_DOMAIN.*AUTH0_CLIENT_ID.*AUTH0_CLIENT_SECRET/,
      );
    });

    it('should allow missing Auth0 vars in development', () => {
      expect(() => validateEnvironment({ ...validConfig, NODE_ENV: 'development' })).not.toThrow();
    });

    it('should allow missing Auth0 vars in test', () => {
      expect(() => validateEnvironment({ ...validConfig, NODE_ENV: 'test' })).not.toThrow();
    });
  });

  describe('enum field validation', () => {
    it('should reject invalid STORAGE_DRIVER', () => {
      expect(() => validateEnvironment({ ...validConfig, STORAGE_DRIVER: 's3' })).toThrow();
    });

    it('should accept all valid STORAGE_DRIVER values', () => {
      ['local', 'gcs'].forEach((driver) => {
        expect(() => validateEnvironment({ ...validConfig, STORAGE_DRIVER: driver })).not.toThrow();
      });
    });

    it('should reject invalid OCR_DRIVER', () => {
      expect(() => validateEnvironment({ ...validConfig, OCR_DRIVER: 'aws-textract' })).toThrow();
    });

    it('should accept all valid OCR_DRIVER values', () => {
      ['mock', 'google-document-ai'].forEach((driver) => {
        expect(() => validateEnvironment({ ...validConfig, OCR_DRIVER: driver })).not.toThrow();
      });
    });

    it('should reject invalid QUEUE_DRIVER', () => {
      expect(() => validateEnvironment({ ...validConfig, QUEUE_DRIVER: 'rabbitmq' })).toThrow();
    });

    it('should accept all valid QUEUE_DRIVER values', () => {
      ['memory', 'pg-boss', 'bullmq'].forEach((driver) => {
        expect(() => validateEnvironment({ ...validConfig, QUEUE_DRIVER: driver })).not.toThrow();
      });
    });

    it('should reject invalid LOG_LEVEL', () => {
      expect(() => validateEnvironment({ ...validConfig, LOG_LEVEL: 'verbose' })).toThrow();
    });

    it('should accept all valid LOG_LEVEL values', () => {
      ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach((level) => {
        expect(() => validateEnvironment({ ...validConfig, LOG_LEVEL: level })).not.toThrow();
      });
    });
  });

  describe('URL validation', () => {
    it('should reject invalid FRONTEND_URL', () => {
      expect(() => validateEnvironment({ ...validConfig, FRONTEND_URL: 'not a url' })).toThrow();
    });

    it('should accept localhost URLs without TLD', () => {
      expect(() =>
        validateEnvironment({
          ...validConfig,
          FRONTEND_URL: 'http://localhost:5173',
        }),
      ).not.toThrow();
    });

    it('should accept production URLs with TLD', () => {
      expect(() =>
        validateEnvironment({
          ...validConfig,
          FRONTEND_URL: 'https://app.example.com',
        }),
      ).not.toThrow();
    });
  });

  describe('error reporting', () => {
    it('should include property name in error message', () => {
      expect(() =>
        validateEnvironment({
          ...validConfig,
          SESSION_SECRET: 'short',
        }),
      ).toThrow(/SESSION_SECRET/);
    });

    it('should include constraint description in error message', () => {
      expect(() =>
        validateEnvironment({
          ...validConfig,
          SESSION_SECRET: 'short',
        }),
      ).toThrow(/at least 32 characters/);
    });

    it('should aggregate multiple validation errors', () => {
      let caughtError: Error | undefined;

      try {
        validateEnvironment({
          ...validConfig,
          NODE_ENV: 'invalid',
          SESSION_SECRET: 'short',
          PORT: 'not-a-number',
        });
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).toBeDefined();
      expect(caughtError?.message).toContain('NODE_ENV');
      expect(caughtError?.message).toContain('SESSION_SECRET');
      expect(caughtError?.message).toContain('PORT');
    });
  });
});
