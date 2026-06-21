import { Injectable } from '@nestjs/common';
import { QueryHandler } from './query-handler';
import { QueryType } from '../../domain/query-type';
import { AnswerFormat, StructuredData } from './answer-format';

/**
 * Fallback handler (Phase 12). Serves `general` and, in the MVP, every
 * type that doesn't yet have a specialised handler — the registry routes
 * unknown types here so the page always answers. Emits pure prose with
 * validated citations; no structured block. Task 12.9 replaces the
 * fan-out with per-type handlers.
 */
@Injectable()
export class GeneralHandler extends QueryHandler {
  readonly type: QueryType = 'general';
  readonly format: AnswerFormat = 'prose';

  protected formatResponse(): StructuredData {
    return null;
  }
}
