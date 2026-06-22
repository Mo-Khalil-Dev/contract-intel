import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../../config/app-config.service';

/**
 * Static-bearer guard for the MCP endpoint (Phase 12).
 *
 * The contract-review agent runtimes authenticate to the MCP server with a
 * static bearer token (supplied as a `static_bearer` vault credential).
 * This guard checks `Authorization: Bearer <token>` against
 * `MCP_BEARER_TOKEN`.
 *
 * If `MCP_BEARER_TOKEN` is unset (local dev, MCP Inspector), the guard
 * allows all requests and logs a one-line warning — so the endpoint is
 * never accidentally left open in a deployment that *meant* to set a token
 * but the operator forgets it's the unset case that's permissive.
 *
 * This is deliberately NOT the app's session/Auth0 guard: the MCP caller is
 * a machine runtime, not a logged-in user, and the clause read-queries are
 * not org-scoped (the bearer is the trust boundary).
 */
@Injectable()
export class McpBearerGuard implements CanActivate {
  private readonly logger = new Logger(McpBearerGuard.name);

  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.mcpBearerToken;

    if (!expected) {
      this.logger.warn(
        'MCP_BEARER_TOKEN is not set — MCP endpoint is unauthenticated. ' +
          'Set it before exposing the endpoint via a tunnel.',
      );
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || token !== expected) {
      throw new UnauthorizedException('Invalid or missing MCP bearer token');
    }

    return true;
  }
}
