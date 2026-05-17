import { ExtractionStatus, ExtractionStatusValue } from './extraction-status.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('ExtractionStatus', () => {
  it('running() is the start state', () => {
    expect(ExtractionStatus.running().value).toBe(ExtractionStatusValue.RUNNING);
  });

  it('allows running → complete', () => {
    const next = ExtractionStatus.running().transitionTo(
      ExtractionStatus.fromValue('complete'),
    );
    expect(next.value).toBe(ExtractionStatusValue.COMPLETE);
  });

  it('allows running → failed', () => {
    const next = ExtractionStatus.running().transitionTo(
      ExtractionStatus.fromValue('failed'),
    );
    expect(next.value).toBe(ExtractionStatusValue.FAILED);
  });

  it('complete is terminal', () => {
    const complete = ExtractionStatus.fromValue('complete');
    expect(complete.isTerminal()).toBe(true);
    expect(() =>
      complete.transitionTo(ExtractionStatus.fromValue('running')),
    ).toThrow(DomainException);
    expect(() =>
      complete.transitionTo(ExtractionStatus.fromValue('failed')),
    ).toThrow(DomainException);
  });

  it('failed is terminal', () => {
    const failed = ExtractionStatus.fromValue('failed');
    expect(failed.isTerminal()).toBe(true);
    expect(() =>
      failed.transitionTo(ExtractionStatus.fromValue('running')),
    ).toThrow(DomainException);
    expect(() =>
      failed.transitionTo(ExtractionStatus.fromValue('complete')),
    ).toThrow(DomainException);
  });

  it('rejects unknown values', () => {
    expect(() => ExtractionStatus.fromValue('paused')).toThrow(DomainException);
  });
});
