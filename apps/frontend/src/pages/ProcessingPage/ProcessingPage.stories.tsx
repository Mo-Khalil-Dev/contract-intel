import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProcessingPageView } from './ProcessingPage.view';
import type { ProcessingStatusResponse } from '@/types/processing';

const documentId = 'b47a490b-fb31-4031-b740-82f8d568dd18';

const noop = () => {};

const baseArgs = {
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

const meta: Meta<typeof ProcessingPageView> = {
  title: 'Pages/ProcessingPage',
  component: ProcessingPageView,
  parameters: { layout: 'fullscreen', backgrounds: { default: 'light' } },
  args: baseArgs,
};
export default meta;
type Story = StoryObj<typeof ProcessingPageView>;

/** Initial load — query is pending, no status yet. */
export const InitialLoad: Story = {
  args: { ...baseArgs, isLoading: true, status: undefined },
};

/** OCR pipeline running — step 0 highlighted. */
export const ProcessingOcr: Story = {
  args: {
    ...baseArgs,
    displayedStep: 0,
    progressPercent: 18,
    status: status({ status: 'processing' }),
  },
};

/** Extraction running — step 3 highlighted (Analyzing risk clauses). */
export const ProcessingExtracting: Story = {
  args: {
    ...baseArgs,
    displayedStep: 3,
    progressPercent: 66,
    status: status({
      status: 'ocr_complete',
      extractionStatus: 'extracting',
      currentExtractionRunId: 'run-123',
    }),
  },
};

/** Terminal success — container will auto-redirect after ~5s. */
export const Complete: Story = {
  args: {
    ...baseArgs,
    displayedStep: 5,
    progressPercent: 100,
    status: status({
      status: 'ocr_complete',
      extractionStatus: 'extraction_complete',
      currentExtractionRunId: 'run-123',
    }),
  },
};

/** Extraction failed — terminal error after OCR succeeded. */
export const ExtractionFailed: Story = {
  args: {
    ...baseArgs,
    displayedStep: 3,
    progressPercent: 60,
    status: status({
      status: 'ocr_complete',
      extractionStatus: 'extraction_failed',
      failureReason: 'context_overflow',
    }),
  },
};

/** Failed first run — retry available (count < 3). */
export const FailedCanRetry: Story = {
  args: {
    ...baseArgs,
    status: status({
      status: 'ocr_failed',
      failureReason: 'transient_exhausted',
      userRetryCount: 0,
      canRetry: true,
    }),
  },
};

/** Retry in flight — button shows "Retrying…" and is disabled. */
export const FailedRetrying: Story = {
  args: {
    ...baseArgs,
    isRetrying: true,
    status: status({
      status: 'ocr_failed',
      failureReason: 'transient_exhausted',
      userRetryCount: 1,
      canRetry: true,
    }),
  },
};

/** Cap exhausted — only "Upload another" remains. */
export const FailedRetriesExhausted: Story = {
  args: {
    ...baseArgs,
    status: status({
      status: 'ocr_failed',
      failureReason: 'unsupported_language:fr',
      userRetryCount: 3,
      canRetry: false,
    }),
  },
};

/** Network / load error on the status endpoint itself. */
export const NetworkError: Story = {
  args: { ...baseArgs, isError: true, status: undefined },
};
