import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {
    this.validateConfig();
  }

  // Server
  get nodeEnv(): string {
    return this.configService.get('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get('PORT', 3000);
  }

  get apiPrefix(): string {
    return this.configService.get('API_PREFIX', 'api/v1');
  }

  get sessionSecret(): string {
    const secret = this.configService.get('SESSION_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters');
    }
    return secret;
  }

  // Auth0
  get auth0Domain(): string {
    return this.configService.get('AUTH0_DOMAIN', '');
  }

  get auth0ClientId(): string {
    return this.configService.get('AUTH0_CLIENT_ID', '');
  }

  get auth0ClientSecret(): string {
    return this.configService.get('AUTH0_CLIENT_SECRET', '');
  }

  get auth0CallbackUrl(): string {
    return this.configService.get('AUTH0_CALLBACK_URL', '');
  }

  // Frontend
  get frontendUrl(): string {
    return this.configService.get('FRONTEND_URL', 'http://localhost:5173');
  }

  // Storage
  get storageDriver(): string {
    return this.configService.get('STORAGE_DRIVER', 'local');
  }

  get localStoragePath(): string {
    return this.configService.get('LOCAL_STORAGE_PATH', './uploads');
  }

  // OCR
  get ocrDriver(): string {
    return this.configService.get('OCR_DRIVER', 'mock');
  }

  // AI
  get claudeApiKey(): string {
    return this.configService.get('CLAUDE_API_KEY', '');
  }

  // Queue
  get queueDriver(): string {
    return this.configService.get('QUEUE_DRIVER', 'memory');
  }

  // Logging
  get logLevel(): string {
    return this.configService.get('LOG_LEVEL', 'debug');
  }

  // CORS
  get corsOrigin(): string {
    return this.configService.get('CORS_ORIGIN', 'http://localhost:5173');
  }

  private validateConfig(): void {
    if (this.nodeEnv === 'production') {
      const requiredVars = [
        'AUTH0_DOMAIN',
        'AUTH0_CLIENT_ID',
        'AUTH0_CLIENT_SECRET',
      ];
      for (const envVar of requiredVars) {
        if (!this.configService.get(envVar)) {
          throw new Error(`Missing required environment variable: ${envVar}`);
        }
      }
    }
  }
}
