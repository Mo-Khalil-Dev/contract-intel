import { Injectable } from '@nestjs/common';
import { QueryType } from '../../domain/query-type';
import { QueryHandler } from './query-handler';
import { RiskAnalysisHandler } from './risk-analysis.handler';
import { GeneralHandler } from './general.handler';

/**
 * Resolves a {@link QueryType} to its {@link QueryHandler} (Phase 12,
 * Task 12.4). Types without a specialised handler fall back to the
 * general (prose) handler, so the page always produces an answer while
 * the remaining handlers are filled in (Task 12.9).
 */
@Injectable()
export class QueryHandlerRegistry {
  private readonly handlers = new Map<QueryType, QueryHandler>();

  constructor(
    risk: RiskAnalysisHandler,
    private readonly fallback: GeneralHandler,
  ) {
    this.register(risk);
    this.register(fallback);
  }

  private register(handler: QueryHandler): void {
    this.handlers.set(handler.type, handler);
  }

  resolve(type: QueryType): QueryHandler {
    return this.handlers.get(type) ?? this.fallback;
  }
}
