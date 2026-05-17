import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetClauseByIdQuery } from './get-clause-by-id.query';
import { ClauseDto } from './clause.dto';
import { clauseToDto } from './clause.mapper';
import {
  CLAUSE_REPOSITORY,
  IClauseRepository,
} from '../../domain/clause.repository';
import { ClauseId } from '../../domain/value-objects/clause-id.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

@QueryHandler(GetClauseByIdQuery)
export class GetClauseByIdHandler
  implements IQueryHandler<GetClauseByIdQuery, ClauseDto>
{
  constructor(
    @Inject(CLAUSE_REPOSITORY) private readonly clauses: IClauseRepository,
  ) {}

  async execute(query: GetClauseByIdQuery): Promise<ClauseDto> {
    const id = ClauseId.fromString(query.clauseId);
    const clause = await this.clauses.findById(id);
    if (!clause) {
      throw new ApplicationException(
        'CLAUSE_NOT_FOUND',
        `Clause ${query.clauseId} not found`,
        404,
      );
    }
    return clauseToDto(clause);
  }
}
