import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetSimilarClausesQuery } from '../application/queries/get-similar-clauses.query';
import type { SimilarClausesResponse } from '../application/queries/similar-clauses.dto';

/**
 * HTTP boundary for clause-intelligence reads (Phase 11).
 *
 * Lives in the clauses module (not documents) because the resource is
 * `clauses/:id/...`, owned by the Clause aggregate. Auth and the
 * response-envelope interceptor are applied globally — see main.ts.
 *
 * Error mapping is delegated to {@link
 * import('../../../shared/exceptions/http-exception.filter')}: any
 * `ApplicationException` thrown by the handler is auto-mapped to its
 * declared httpStatus + code, so this controller never needs explicit
 * try/catch + status mapping.
 *
 * One subtle decision: `id` is taken as a raw string param and forwarded
 * to the query unchanged. Format validation (must be a v4 UUID) happens
 * inside the handler when it constructs `ClauseId.fromString(...)` —
 * keeping it there means HTTP and any future caller (GraphQL, RPC,
 * test) get identical error semantics.
 */
@ApiTags('Clauses')
@Controller('clauses')
export class ClausesController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * GET /api/v1/clauses/:id/similar?limit=5
   *
   * Returns the source clause summary plus a ranked list of up to
   * `limit` most-similar clauses across the user's portfolio. See
   * US-CI-1 (Requirement 14) for the full contract.
   */
  @Get(':id/similar')
  @ApiOkResponse({
    description:
      'Source clause summary plus ranked precedent matches (same type, different document).',
  })
  async findSimilar(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<SimilarClausesResponse> {
    return this.queryBus.execute<
      GetSimilarClausesQuery,
      SimilarClausesResponse
    >(new GetSimilarClausesQuery(id, limit));
  }
}
