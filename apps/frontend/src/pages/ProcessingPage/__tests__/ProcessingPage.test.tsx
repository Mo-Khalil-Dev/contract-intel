import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProcessingPage } from '../ProcessingPage';
import { processingService } from '@/services/processingService';
import type { ProcessingStatusResponse } from '@/types/processing';

vi.mock('@/services/processingService', () => ({
  processingService: {
    getProcessingStatus: vi.fn(),
    retryOcr: vi.fn(),
  },
}));

const mockGet = vi.mocked(processingService.getProcessingStatus);
const mockRetry = vi.mocked(processingService.retryOcr);

const documentId = 'b47a490b-fb31-4031-b740-82f8d568dd18';

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

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/processing/${documentId}`]}>
        <Routes>
          <Route path="/processing/:documentId" element={<ProcessingPage />} />
          <Route path="/results/:documentId" element={<div>RESULTS PAGE</div>} />
          <Route path="/upload" element={<div>UPLOAD PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockGet.mockReset();
  mockRetry.mockReset();
});

describe('ProcessingPage', () => {
  it('shows the processing state while the pipeline runs', async () => {
    mockGet.mockResolvedValue(status({ status: 'processing' }));
    renderPage();
    expect(await screen.findByText(/extracting text/i)).toBeInTheDocument();
    expect(screen.getByText(documentId)).toBeInTheDocument();
  });

  it('redirects to /results/:id once OCR is complete', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGet.mockResolvedValue(status({ status: 'ocr_complete' }));
    renderPage();

    expect(await screen.findByText(/analysis ready/i)).toBeInTheDocument();
    // Auto-navigate fires after a 1.2s delay so users see the success flash.
    await act(async () => {
      vi.advanceTimersByTime(1300);
    });
    expect(await screen.findByText('RESULTS PAGE')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows the retry button when OCR failed and retries remain', async () => {
    mockGet.mockResolvedValue(
      status({
        status: 'ocr_failed',
        failureReason: 'transient_exhausted',
        canRetry: true,
        userRetryCount: 0,
      }),
    );
    renderPage();

    expect(await screen.findByText(/ocr couldn't complete/i)).toBeInTheDocument();
    expect(screen.getByText('transient_exhausted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry ocr/i })).toBeInTheDocument();
  });

  it('hides retry once the user-retry cap is hit', async () => {
    mockGet.mockResolvedValue(
      status({
        status: 'ocr_failed',
        failureReason: 'unsupported_language:fr',
        canRetry: false,
        userRetryCount: 3,
      }),
    );
    renderPage();

    await screen.findByText(/ocr couldn't complete/i);
    expect(screen.queryByRole('button', { name: /retry ocr/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload another/i })).toBeInTheDocument();
  });

  it('calls retryOcr when the user clicks Retry', async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(
      status({
        status: 'ocr_failed',
        failureReason: 'transient_exhausted',
        canRetry: true,
      }),
    );
    mockRetry.mockResolvedValue(undefined);

    renderPage();
    const retryBtn = await screen.findByRole('button', { name: /retry ocr/i });
    await user.click(retryBtn);

    expect(mockRetry).toHaveBeenCalledTimes(1);
    expect(mockRetry).toHaveBeenCalledWith(documentId);
  });
});
