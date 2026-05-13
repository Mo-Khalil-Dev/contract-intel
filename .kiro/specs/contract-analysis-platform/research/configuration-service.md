# Configuration Service

## Env Files Per Environment

```
.env                  ← shared defaults (committed, no secrets)
.env.local            ← local dev overrides (gitignored)
.env.demo             ← Railway demo config (gitignored)
.env.production       ← production config (gitignored)
.env.test             ← test environment (committed, safe values only)
```

Loading order (later overrides earlier):

```
.env → .env.{NODE_ENV} → .env.{NODE_ENV}.local → process.env
```

## AppConfigService

Single injectable class — one-stop shop for all config regardless of source (env file, Secret Manager).

```typescript
// src/shared/config/app-config.service.ts
@Injectable()
export class AppConfigService {
  constructor(
    private readonly config: ConfigService,
    @Inject(SECRETS_SERVICE) private readonly secrets: SecretsService,
  ) {}

  // Database
  get databaseUrl(): string {
    return this.config.getOrThrow('DATABASE_URL');
  }

  // Auth0
  get auth0Domain(): string {
    return this.config.getOrThrow('AUTH0_DOMAIN');
  }
  get auth0Audience(): string {
    return this.config.getOrThrow('AUTH0_AUDIENCE');
  }

  // Claude API (from Secret Manager in production)
  async anthropicApiKey(): Promise<string> {
    return this.secrets.getSecret('ANTHROPIC_API_KEY');
  }

  // Drivers
  get storageDriver(): 'gcs' | 'local' {
    return this.config.getOrThrow('STORAGE_DRIVER');
  }
  get queueDriver(): 'memory' | 'pg-boss' | 'bullmq' {
    return this.config.getOrThrow('QUEUE_DRIVER');
  }
  get ocrDriver(): 'google-document-ai' | 'mock' {
    return this.config.getOrThrow('OCR_DRIVER');
  }
  get loggerDriver(): 'console' | 'pino' {
    return this.config.get('LOGGER_DRIVER', 'console');
  }

  // App
  get nodeEnv(): 'development' | 'test' | 'production' {
    return this.config.get('NODE_ENV', 'development');
  }
  get port(): number {
    return this.config.get<number>('PORT', 3000);
  }
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
  get corsOrigins(): string[] {
    return this.config.get('CORS_ORIGINS', 'http://localhost:5173').split(',');
  }
}
```

## Startup Validation

App refuses to start if required env vars are missing:

```typescript
// src/shared/config/config.validation.ts
class EnvironmentVariables {
  @IsEnum(['development', 'test', 'production']) NODE_ENV: string;
  @IsString() @IsNotEmpty() DATABASE_URL: string;
  @IsString() @IsNotEmpty() AUTH0_DOMAIN: string;
  @IsString() @IsNotEmpty() AUTH0_AUDIENCE: string;
  @IsEnum(['gcs', 'local']) STORAGE_DRIVER: string;
  @IsEnum(['memory', 'pg-boss', 'bullmq']) QUEUE_DRIVER: string;
  @IsEnum(['google-document-ai', 'mock']) OCR_DRIVER: string;
  @IsEnum(['gcp-secret-manager', 'env']) SECRETS_DRIVER: string;
  @IsNumber() PORT: number = 3000;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated);
  if (errors.length > 0) throw new Error(`Configuration validation failed:\n${errors.toString()}`);
  return validated;
}
```

## Module Setup

```typescript
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        '.env.local',
        '.env',
      ],
      validate,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
```
