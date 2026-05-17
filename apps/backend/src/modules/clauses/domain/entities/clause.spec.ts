import { Clause, EMBEDDING_DIM, MAX_CLAUSE_TEXT_LENGTH } from './clause';
import { ConfidenceScore } from '../../../documents/domain/value-objects/confidence-score.vo';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ClauseType } from '../value-objects/clause-type.vo';
import { ExtractionRunId } from '../value-objects/extraction-run-id.vo';
import { ModelVersion } from '../value-objects/model-version.vo';
import { TextPosition } from '../value-objects/text-position.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

function buildClause(overrides: { runId?: ExtractionRunId; text?: string } = {}) {
  return Clause.create({
    extractionRunId: overrides.runId ?? ExtractionRunId.create(),
    documentId: DocumentId.create(),
    type: ClauseType.fromValue('indemnification'),
    confidence: ConfidenceScore.fromNumber(0.9),
    position: TextPosition.create({ startOffset: 0, endOffset: 10, pageNumber: 1 }),
    text: overrides.text ?? 'sample',
  });
}

describe('Clause', () => {
  it('create() builds a clause with default null embedding and parent', () => {
    const c = buildClause();
    expect(c.embedding).toBeNull();
    expect(c.parentClauseId).toBeNull();
    expect(c.embeddingModelVersion).toBeNull();
  });

  it('rejects empty text', () => {
    expect(() => buildClause({ text: '' })).toThrow(DomainException);
  });

  it('rejects text > 32k chars', () => {
    expect(() => buildClause({ text: 'a'.repeat(MAX_CLAUSE_TEXT_LENGTH + 1) })).toThrow(
      DomainException,
    );
  });

  it('accepts text exactly 32k chars', () => {
    expect(() =>
      buildClause({ text: 'a'.repeat(MAX_CLAUSE_TEXT_LENGTH) }),
    ).not.toThrow();
  });

  describe('attachEmbedding', () => {
    it('accepts a 1024-dim finite vector', () => {
      const c = buildClause();
      const v = new Array(EMBEDDING_DIM).fill(0.1);
      const mv = ModelVersion.parse('voyage/voyage-law-2@2026-05');
      c.attachEmbedding(v, mv);
      expect(c.embedding).toBe(v);
      expect(c.embeddingModelVersion).toBe(mv);
    });

    it('rejects wrong dimension', () => {
      const c = buildClause();
      const mv = ModelVersion.parse('voyage/voyage-law-2@2026-05');
      expect(() => c.attachEmbedding([0.1, 0.2], mv)).toThrow(DomainException);
    });

    it('rejects vectors with NaN/Infinity', () => {
      const c = buildClause();
      const mv = ModelVersion.parse('voyage/voyage-law-2@2026-05');
      const bad = new Array(EMBEDDING_DIM).fill(0);
      bad[5] = NaN;
      expect(() => c.attachEmbedding(bad, mv)).toThrow(DomainException);
    });
  });

  describe('linkParent', () => {
    it('links a parent in the same run', () => {
      const runId = ExtractionRunId.create();
      const parent = buildClause({ runId });
      const child = buildClause({ runId });
      child.linkParent(parent);
      expect(child.parentClauseId?.equals(parent.id)).toBe(true);
    });

    it('rejects cross-run parent', () => {
      const parent = buildClause({ runId: ExtractionRunId.create() });
      const child = buildClause({ runId: ExtractionRunId.create() });
      expect(() => child.linkParent(parent)).toThrow(DomainException);
    });

    it('rejects self-parent', () => {
      const c = buildClause();
      expect(() => c.linkParent(c)).toThrow(DomainException);
    });
  });
});
