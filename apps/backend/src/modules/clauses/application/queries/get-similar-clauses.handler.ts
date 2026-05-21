import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetSimilarClausesQuery } from './get-similar-clauses.query';
import {
  SimilarClauseDto,
  SimilarClausesResponse,
  toSnippet,
} from './similar-clauses.dto';
import {
  CLAUSE_REPOSITORY,
  IClauseRepository,
} from '../../domain/clause.repository';
import {
  CLAUSE_SIMILARITY_REPOSITORY,
  ClauseSimilarityRepository,
  SimilarClauseRow,
} from '../ports/clause-similarity.repository';
import { ClauseId } from '../../domain/value-objects/clause-id.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

/**
 * Handler for {@link GetSimilarClausesQuery}.
 *
 * Three responsibilities, no more:
 *
 *   1. **Validate `limit`** at the application boundary. The HTTP
 *      controller passes through whatever it received; we enforce
 *      [1, MAX_LIMIT] here so the error code is identical regardless
 *      of which caller (HTTP / future GraphQL / a test) issues the
 *      query.
 *
 *   2. **Load the source clause and check preconditions.** Two
 *      distinct failure modes get distinct error codes (US-CI-1 AC4):
 *        - source missing                → 404 clause_not_found
 *        - source has no embedding       → 409 clause_not_embedded
 *      We don't conflate them; "no embedding" is a recoverable
 *      condition (re-run the embed job), while "no clause" is not.
 *
 *   3. **Delegate to the similarity repository** and map rows to the
 *      response DTO (snippet trimming, ISO date serialisation). The
 *      handler itself doesn't know about pgvector — it asks the port.
 */
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 20;

@QueryHandler(GetSimilarClausesQuery)
export class GetSimilarClausesHandler
  implements IQueryHandler<GetSimilarClausesQuery, SimilarClausesResponse>
{
  constructor(
    @Inject(CLAUSE_REPOSITORY) private readonly clauses: IClauseRepository,
    @Inject(CLAUSE_SIMILARITY_REPOSITORY)
    private readonly similarity: ClauseSimilarityRepository,
  ) {}

  async execute(
    query: GetSimilarClausesQuery,
  ): Promise<SimilarClausesResponse> {
    const limit = this.validateLimit(query.limit);

    const sourceId = ClauseId.fromString(query.clauseId);
    const source = await this.clauses.findById(sourceId);
    if (!source) {
      throw new ApplicationException(
        'CLAUSE_NOT_FOUND',
        `Clause ${query.clauseId} not found`,
        404,
      );
    }
    if (source.embedding == null) {
      throw new ApplicationException(
        'CLAUSE_NOT_EMBEDDED',
        `Clause ${query.clauseId} has no embedding; cannot run similarity search`,
        409,
      );
    }

    const rows = await this.similarity.findSimilar({
      sourceClauseId: source.id.value,
      sourceDocumentId: source.documentId.value,
      clauseType: source.type.value,
      limit,
    });

    return {
      source: {
        id: source.id.value,
        type: source.type.value,
        textSnippet: toSnippet(source.text),
        documentId: source.documentId.value,
      },
      results: rows.map(toResultDto),
    };
  }

  private validateLimit(limit: number): number {
    if (!Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
      throw new ApplicationException(
        'INVALID_LIMIT',
        `limit must be an integer in [${MIN_LIMIT}, ${MAX_LIMIT}] (got ${limit})`,
        400,
      );
    }
    return limit;
  }
}

function toResultDto(row: SimilarClauseRow): SimilarClauseDto {
  return {
    id: row.id,
    type: row.type,
    textSnippet: toSnippet(row.text),
    similarity: row.similarity,
    document: {
      id: row.document.id,
      title: row.document.title,
      uploadedAt: row.document.uploadedAt.toISOString(),
    },
    pageNumber: row.pageNumber,
    sectionRef: row.sectionRef,
  };
}
