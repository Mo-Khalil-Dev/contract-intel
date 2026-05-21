import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { SimilarClausesDrawer } from './SimilarClausesDrawer';
import { similarClausesService } from '@/services/similarClausesService';
import type { SimilarClausesResponse } from '@/types/similarClauses';

vi.mock('@/services/similarClausesService');

const SOURCE_ID = 'a8fba0bd-10e2-41da-ac11-38f962427a4f';

const baseResponse: SimilarClausesResponse = {
  source: {
    id: SOURCE_ID,
    type: 'indemnification',
    textSnippet: 'Indemnification Each Party shall defend…',
    documentId: '54ad2c76-15df-4305-b833-ea8aa4247754',
  },
  results: [
    {
      id: '3e300894-978f-464d-bc34-6cfd3acf8c73',
      type: 'indemnification',
      textSnippet: 'Indemnification Buyer shall defend…',
      similarity: 0.62,
      document: {
        id: '4b34c764-0dff-49bf-b3f5-d04488ecf9c4',
        title: 'saas-vendor-risky.pdf',
        uploadedAt: '2026-05-17T15:45:34.421Z',
      },
      pageNumber: 1,
      sectionRef: null,
    },
  ],
};

function renderDrawer(
  overrides: Partial<React.ComponentProps<typeof SimilarClausesDrawer>> = {},
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const props = {
    clauseId: SOURCE_ID,
    onClose: vi.fn(),
    onSelectResult: vi.fn(),
    ...overrides,
  };
  const utils = render(
    <QueryClientProvider client={qc}>
      <SimilarClausesDrawer {...props} />
    </QueryClientProvider>,
  );
  return { ...utils, props };
}

describe('SimilarClausesDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when clauseId is null', () => {
    const { container } = renderDrawer({ clauseId: null });
    expect(container.firstChild).toBeNull();
    expect(similarClausesService.getSimilar).not.toHaveBeenCalled();
  });

  it('shows skeleton list while loading', () => {
    (similarClausesService.getSimilar as Mock).mockImplementation(
      () => new Promise(() => {}), // never resolves
    );
    renderDrawer();
    expect(
      screen.getByLabelText('Loading similar clauses'),
    ).toBeInTheDocument();
  });

  it('renders source block + results when data loads', async () => {
    (similarClausesService.getSimilar as Mock).mockResolvedValue(baseResponse);
    renderDrawer();

    await waitFor(() => {
      expect(screen.getByText('1 similar clause')).toBeInTheDocument();
    });
    // Source label appears in the source block
    expect(screen.getByText('Source')).toBeInTheDocument();
    // Result row uses humanised type
    expect(screen.getAllByText('Indemnification').length).toBeGreaterThan(0);
  });

  it('pluralises the header for multiple results', async () => {
    const multi: SimilarClausesResponse = {
      ...baseResponse,
      results: [
        baseResponse.results[0],
        { ...baseResponse.results[0], id: 'second', similarity: 0.55 },
      ],
    };
    (similarClausesService.getSimilar as Mock).mockResolvedValue(multi);
    renderDrawer();

    await waitFor(() =>
      expect(screen.getByText('2 similar clauses')).toBeInTheDocument(),
    );
  });

  it('renders the empty state when results is empty', async () => {
    (similarClausesService.getSimilar as Mock).mockResolvedValue({
      ...baseResponse,
      results: [],
    });
    const { container } = renderDrawer();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /No similar clauses found yet/i }),
      ).toBeInTheDocument();
    });
    // Personalised copy wraps the type in <strong>, so the body text
    // is split across nodes — assert against the container's collapsed
    // textContent rather than getByText.
    expect(container.textContent).toMatch(/This is the first Indemnification clause/i);
  });

  it('renders an error message and retry button on failure', async () => {
    (similarClausesService.getSimilar as Mock).mockRejectedValue(
      new Error('boom'),
    );
    renderDrawer();

    await waitFor(() =>
      expect(screen.getByText(/Couldn.t load similar clauses/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('invokes onClose when the close button is clicked', async () => {
    (similarClausesService.getSimilar as Mock).mockResolvedValue(baseResponse);
    const { props } = renderDrawer();

    fireEvent.click(
      screen.getByRole('button', { name: 'Close similar clauses drawer' }),
    );
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onClose on Escape', async () => {
    (similarClausesService.getSimilar as Mock).mockResolvedValue(baseResponse);
    const { props } = renderDrawer();

    await waitFor(() =>
      expect(screen.getByText('1 similar clause')).toBeInTheDocument(),
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onClose when clicking the backdrop (not on the panel)', async () => {
    (similarClausesService.getSimilar as Mock).mockResolvedValue(baseResponse);
    const { props } = renderDrawer();

    fireEvent.mouseDown(screen.getByTestId('similar-clauses-backdrop'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('forwards row clicks to onSelectResult', async () => {
    (similarClausesService.getSimilar as Mock).mockResolvedValue(baseResponse);
    const { props } = renderDrawer();

    await waitFor(() =>
      expect(screen.getByText('1 similar clause')).toBeInTheDocument(),
    );
    // The result row is a <button>; click it.
    const rows = screen.getAllByRole('button');
    // First button is the close icon, second is source (no), then result row(s).
    // Click the row whose accessible text contains the snippet.
    const rowButton = rows.find((b) =>
      b.textContent?.includes('Indemnification Buyer shall defend'),
    )!;
    fireEvent.click(rowButton);

    expect(props.onSelectResult).toHaveBeenCalledTimes(1);
    expect(props.onSelectResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: baseResponse.results[0].id }),
    );
  });

  it('marks the activeResultId row as active', async () => {
    (similarClausesService.getSimilar as Mock).mockResolvedValue(baseResponse);
    renderDrawer({ activeResultId: baseResponse.results[0].id });

    await waitFor(() =>
      expect(screen.getByText('1 similar clause')).toBeInTheDocument(),
    );
    const rowButton = screen
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-current') === 'true');
    expect(rowButton).toBeDefined();
  });
});
