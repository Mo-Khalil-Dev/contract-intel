import { ExtractionRun } from './extraction-run.aggregate';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ModelVersion } from '../value-objects/model-version.vo';
import { ContractMetadata } from '../value-objects/contract-metadata.vo';
import {
  ClauseExtractionCompletedEvent,
  ClauseExtractionFailedEvent,
  ClauseExtractionStartedEvent,
  ClausesExtractedEvent,
} from '../events/clause.events';
import { DomainException } from '../../../../shared/exceptions/app-error';

function startRun() {
  return ExtractionRun.start({
    documentId: DocumentId.create(),
    classifierModelVersion: ModelVersion.parse('anthropic/claude-opus-4-7@2026-05'),
    embeddingModelVersion: ModelVersion.parse('voyage/voyage-law-2@2026-05'),
  });
}

describe('ExtractionRun', () => {
  describe('start', () => {
    it('creates a running run and emits ClauseExtractionStartedEvent', () => {
      const run = startRun();
      expect(run.isRunning()).toBe(true);
      expect(run.completedAt).toBeNull();
      expect(run.clauseCount).toBe(0);
      const events = run.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ClauseExtractionStartedEvent);
    });
  });

  describe('complete', () => {
    it('transitions running → complete, sets counts, emits two events', () => {
      const run = startRun();
      run.pullDomainEvents();
      run.complete({ clauseCount: 5, droppedClauseCount: 1 });
      expect(run.isComplete()).toBe(true);
      expect(run.clauseCount).toBe(5);
      expect(run.droppedClauseCount).toBe(1);
      expect(run.completedAt).not.toBeNull();
      const events = run.getDomainEvents();
      expect(events).toHaveLength(2);
      expect(events[0]).toBeInstanceOf(ClausesExtractedEvent);
      expect(events[1]).toBeInstanceOf(ClauseExtractionCompletedEvent);
    });

    it('rejects negative clauseCount', () => {
      const run = startRun();
      expect(() =>
        run.complete({ clauseCount: -1, droppedClauseCount: 0 }),
      ).toThrow(DomainException);
    });

    it('rejects non-integer clauseCount', () => {
      const run = startRun();
      expect(() =>
        run.complete({ clauseCount: 1.5, droppedClauseCount: 0 }),
      ).toThrow(DomainException);
    });

    it('rejects negative droppedClauseCount', () => {
      const run = startRun();
      expect(() =>
        run.complete({ clauseCount: 0, droppedClauseCount: -1 }),
      ).toThrow(DomainException);
    });

    it('accepts clauseCount = 0 (extraction returned nothing)', () => {
      const run = startRun();
      expect(() =>
        run.complete({ clauseCount: 0, droppedClauseCount: 0 }),
      ).not.toThrow();
    });

    it('persists metadata snapshot when provided', () => {
      const run = startRun();
      const metadata = ContractMetadata.create({
        contractType: 'NDA',
        parties: [{ role: 'Discloser', name: 'X' }],
      });
      run.complete({ clauseCount: 0, droppedClauseCount: 0, metadata });
      expect(run.metadata).not.toBeNull();
      expect(run.metadata?.contractType).toBe('NDA');
    });

    it('defaults metadata to null when omitted', () => {
      const run = startRun();
      run.complete({ clauseCount: 0, droppedClauseCount: 0 });
      expect(run.metadata).toBeNull();
    });

    it('cannot complete twice', () => {
      const run = startRun();
      run.complete({ clauseCount: 1, droppedClauseCount: 0 });
      expect(() =>
        run.complete({ clauseCount: 2, droppedClauseCount: 0 }),
      ).toThrow(DomainException);
    });
  });

  describe('fail', () => {
    it('transitions running → failed, records reason, emits event', () => {
      const run = startRun();
      run.pullDomainEvents();
      run.fail('claude_unavailable');
      expect(run.isFailed()).toBe(true);
      expect(run.failureReason).toBe('claude_unavailable');
      const events = run.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ClauseExtractionFailedEvent);
    });

    it('rejects empty reason', () => {
      const run = startRun();
      expect(() => run.fail('')).toThrow(DomainException);
      expect(() => run.fail('   ')).toThrow(DomainException);
    });

    it('cannot fail after complete', () => {
      const run = startRun();
      run.complete({ clauseCount: 1, droppedClauseCount: 0 });
      expect(() => run.fail('too_late')).toThrow(DomainException);
    });

    it('cannot fail twice', () => {
      const run = startRun();
      run.fail('first');
      expect(() => run.fail('second')).toThrow(DomainException);
    });
  });
});
