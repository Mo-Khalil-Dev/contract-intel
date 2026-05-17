import { Clause } from '../../domain/entities/clause';
import { ClauseDto } from './clause.dto';

export function clauseToDto(clause: Clause): ClauseDto {
  return {
    id: clause.id.value,
    extractionRunId: clause.extractionRunId.value,
    documentId: clause.documentId.value,
    parentClauseId: clause.parentClauseId?.value ?? null,
    type: clause.type.value,
    confidence: clause.confidence.value,
    pageNumber: clause.position.pageNumber,
    startOffset: clause.position.startOffset,
    endOffset: clause.position.endOffset,
    text: clause.text,
    hasEmbedding: clause.embedding !== null,
    risk: clause.risk
      ? {
          score: clause.risk.score,
          level: clause.risk.level.value,
          flags: clause.risk.flags,
          explanation: clause.risk.explanation,
        }
      : null,
    createdAt: clause.createdAt.toISOString(),
  };
}
