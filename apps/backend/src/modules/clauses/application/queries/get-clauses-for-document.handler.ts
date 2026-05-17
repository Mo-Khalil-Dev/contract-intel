import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetClausesForDocumentQuery } from './get-clauses-for-document.query';
import { ClauseDto } from './clause.dto';
import { clauseToDto } from './clause.mapper';
import {
  CLAUSE_REPOSITORY,
  IClauseRepository,
} from '../../domain/clause.repository';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';

@QueryHandler(GetClausesForDocumentQuery)
export class GetClausesForDocumentHandler
  implements IQueryHandler<GetClausesForDocumentQuery, ClauseDto[]>
{
  constructor(
    @Inject(CLAUSE_REPOSITORY) private readonly clauses: IClauseRepository,
  ) {}

  async execute(query: GetClausesForDocumentQuery): Promise<ClauseDto[]> {
    const docId = DocumentId.fromString(query.documentId);
    const clauses = await this.clauses.findByDocumentId(docId);
    return clauses.map(clauseToDto);
  }
}
