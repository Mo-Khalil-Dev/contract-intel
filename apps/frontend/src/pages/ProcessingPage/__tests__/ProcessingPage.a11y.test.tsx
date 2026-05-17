import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProcessingPageView } from '../ProcessingPage.view';
import type { ProcessingStatusResponse } from '@/types/processing';

expect.extend(toHaveNoViolations);

const documentId = 'b47a490b-fb31-4031-b740-82f8d568dd18';
const noop = () => {};

const baseProps = {
  documentId,
  isLoading: false,
  isError: false,
  isRetrying: false,
  displayedStep: 0,
  tipIndex: 0,
  progressPercent: 12,
  onRetry: noop,
  onUploadAnother: noop,
  onBackToDashboard: noop,
};

function status(overrides: Partial<ProcessingStatusResponse> = {}): ProcessingStatusResponse {
  return {
    documentId,
    status: 'processing',
    failureReason: null,
    userRetryCount: 0,
    canRetry: false,
    extractionStatus: 'not_started',
    currentExtractionRunId: null,
    ...overrides,
  };
}

describe('ProcessingPage — Accessibility', () => {
  it('processing state has no axe violations', async () => {
    const { container } = render(
      <ProcessingPageView {...baseProps} status={status()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('extraction-complete state has no axe violations', async () => {
    const { container } = render(
      <ProcessingPageView
        {...baseProps}
        displayedStep={5}
        progressPercent={100}
        status={status({
          status: 'ocr_complete',
          extractionStatus: 'extraction_complete',
        })}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('failed (can retry) state has no axe violations', async () => {
    const { container } = render(
      <ProcessingPageView
        {...baseProps}
        status={status({
          status: 'ocr_failed',
          failureReason: 'transient_exhausted',
          canRetry: true,
        })}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('failed (retries exhausted) state has no axe violations', async () => {
    const { container } = render(
      <ProcessingPageView
        {...baseProps}
        status={status({
          status: 'ocr_failed',
          failureReason: 'unsupported_language:fr',
          userRetryCount: 3,
          canRetry: false,
        })}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('network-error state has no axe violations', async () => {
    const { container } = render(
      <ProcessingPageView {...baseProps} isError status={undefined} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
