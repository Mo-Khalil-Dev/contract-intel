import { ExtractionRunId } from './extraction-run-id.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('ExtractionRunId', () => {
  it('create() produces a valid UUID', () => {
    expect(ExtractionRunId.create().value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('fromString rejects invalid UUIDs', () => {
    expect(() => ExtractionRunId.fromString('nope')).toThrow(DomainException);
  });
});
