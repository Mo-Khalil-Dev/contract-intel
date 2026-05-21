import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useSimilarClauses } from '../useSimilarClauses';
import { similarClausesService } from '@/services/similarClausesService';
import type { SimilarClausesResponse } from '@/types/similarClauses';

vi.mock('@/services/similarClausesService');

const SOURCE_ID = 'a8fba0bd-10e2-41da-ac11-38f962427a4f';

const mockResponse: SimilarClausesResponse = {
  source: {
    id: SOURCE_ID,
    type: 'indemnification',
    textSnippet: 'Indemnification Each Party shall defend…',
    documentId: '54ad2c76-15df-4305-b833-ea8aa4247754',
  },
  results: [],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
};

describe('useSimilarClauses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when clauseId is null', () => {
    const { result } = renderHook(() => useSimilarClauses(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(similarClausesService.getSimilar).not.toHaveBeenCalled();
  });

  it('does not fetch when clauseId is undefined', () => {
    renderHook(() => useSimilarClauses(undefined), {
      wrapper: createWrapper(),
    });
    expect(similarClausesService.getSimilar).not.toHaveBeenCalled();
  });

  it('fetches with the provided clauseId and default limit (5)', async () => {
    (similarClausesService.getSimilar as Mock).mockResolvedValue(
      mockResponse,
    );

    const { result } = renderHook(() => useSimilarClauses(SOURCE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(similarClausesService.getSimilar).toHaveBeenCalledWith(
      SOURCE_ID,
      5,
    );
    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.isError).toBe(false);
  });

  it('forwards a custom limit to the service', async () => {
    (similarClausesService.getSimilar as Mock).mockResolvedValue(
      mockResponse,
    );

    renderHook(() => useSimilarClauses(SOURCE_ID, 12), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(similarClausesService.getSimilar).toHaveBeenCalledWith(
        SOURCE_ID,
        12,
      );
    });
  });

  it('surfaces errors from the service (e.g. 404 / 409)', async () => {
    const err = new Error('CLAUSE_NOT_FOUND');
    (similarClausesService.getSimilar as Mock).mockRejectedValue(err);

    const { result } = renderHook(() => useSimilarClauses(SOURCE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(err);
  });

  it('does not retry on error (retry: 0)', async () => {
    const err = new Error('CLAUSE_NOT_EMBEDDED');
    (similarClausesService.getSimilar as Mock).mockRejectedValue(err);

    const { result } = renderHook(() => useSimilarClauses(SOURCE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Single call: the hook explicitly disables retries (see useSimilarClauses
    // comment) so 4xx surfaces immediately in the UI.
    expect(similarClausesService.getSimilar).toHaveBeenCalledTimes(1);
  });
});
