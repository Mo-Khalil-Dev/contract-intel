import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDocumentList } from '../useDocumentList';
import { documentListService } from '@/services/documentListService';
import { DEFAULTS } from '@/lib/documentListFilters/defaults';
import type { DocumentListResponse } from '@/types/contracts';

vi.mock('@/services/documentListService');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const MOCK_RESPONSE: DocumentListResponse = {
  items: [
    {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      orgId: 'org-1',
      name: 'Acme Vendor Agreement',
      type: 'vendor',
      counterparty: 'Acme Corp',
      riskScore: 6.5,
      flagsRed: 2,
      flagsOrange: 1,
      flagsBlue: 0,
      terminationDate: '2027-12-31',
      status: 'complete',
      uploadedAt: '2026-05-01T10:00:00Z',
      hasUnlimitedLiability: false,
      updatedAt: '2026-05-01T11:00:00Z',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 8,
  totalPages: 1,
  summary: {
    totalContracts: 1,
    analysed: 1,
    avgRisk: 6.5,
    criticalFlags: 2,
    unlimitedLiability: 0,
  },
};

const mockGetDocumentList = vi.mocked(documentListService.getDocumentList);

describe('useDocumentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockGetDocumentList.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useDocumentList(DEFAULTS), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('returns data after a successful fetch', async () => {
    mockGetDocumentList.mockResolvedValue(MOCK_RESPONSE);

    const { result } = renderHook(() => useDocumentList(DEFAULTS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Acme Vendor Agreement');
    expect(result.current.total).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it('returns summary KPIs from the response', async () => {
    mockGetDocumentList.mockResolvedValue(MOCK_RESPONSE);

    const { result } = renderHook(() => useDocumentList(DEFAULTS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.summary.totalContracts).toBe(1);
    expect(result.current.summary.avgRisk).toBe(6.5);
    expect(result.current.summary.criticalFlags).toBe(2);
  });

  it('returns zero-value defaults before data arrives', () => {
    mockGetDocumentList.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useDocumentList(DEFAULTS), {
      wrapper: createWrapper(),
    });

    expect(result.current.summary.totalContracts).toBe(0);
    expect(result.current.summary.avgRisk).toBe(0);
    expect(result.current.items).toEqual([]);
  });

  it('passes filters to the service', async () => {
    mockGetDocumentList.mockResolvedValue(MOCK_RESPONSE);
    const filters = { ...DEFAULTS, risk: 'high' as const, sort: 'date' as const, page: 2 };

    renderHook(() => useDocumentList(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(mockGetDocumentList).toHaveBeenCalledWith(filters));
  });

  it('sets error state on fetch failure', async () => {
    mockGetDocumentList.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDocumentList(DEFAULTS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.items).toEqual([]);
  });

  it('exposes a refetch function', () => {
    mockGetDocumentList.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useDocumentList(DEFAULTS), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});
