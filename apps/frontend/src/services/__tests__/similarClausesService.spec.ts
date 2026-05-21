import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { similarClausesService } from '../similarClausesService';
import { httpService } from '@/api/httpService';
import { unwrap } from '@/api/unwrap';
import { API } from '@/api/endpoints';
import type { SimilarClausesResponse } from '@/types/similarClauses';

vi.mock('@/api/httpService');
vi.mock('@/api/unwrap');

const SOURCE_ID = 'a8fba0bd-10e2-41da-ac11-38f962427a4f';

const mockResponse: SimilarClausesResponse = {
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

describe('similarClausesService.getSimilar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls httpService.get with SIMILAR_CLAUSES(id) and the limit param', async () => {
    (httpService.get as Mock).mockResolvedValue({
      success: true,
      data: mockResponse,
    });
    (unwrap as Mock).mockReturnValue(mockResponse);

    await similarClausesService.getSimilar(SOURCE_ID, 5);

    expect(httpService.get).toHaveBeenCalledWith(
      API.SIMILAR_CLAUSES(SOURCE_ID),
      { params: { limit: 5 } },
    );
  });

  it('defaults limit to 5 when omitted', async () => {
    (httpService.get as Mock).mockResolvedValue({
      success: true,
      data: mockResponse,
    });
    (unwrap as Mock).mockReturnValue(mockResponse);

    await similarClausesService.getSimilar(SOURCE_ID);

    expect(httpService.get).toHaveBeenCalledWith(
      API.SIMILAR_CLAUSES(SOURCE_ID),
      { params: { limit: 5 } },
    );
  });

  it('passes through a custom limit', async () => {
    (httpService.get as Mock).mockResolvedValue({
      success: true,
      data: mockResponse,
    });
    (unwrap as Mock).mockReturnValue(mockResponse);

    await similarClausesService.getSimilar(SOURCE_ID, 12);

    expect(httpService.get).toHaveBeenCalledWith(
      API.SIMILAR_CLAUSES(SOURCE_ID),
      { params: { limit: 12 } },
    );
  });

  it('returns the unwrapped SimilarClausesResponse', async () => {
    (httpService.get as Mock).mockResolvedValue({
      success: true,
      data: mockResponse,
    });
    (unwrap as Mock).mockReturnValue(mockResponse);

    const result = await similarClausesService.getSimilar(SOURCE_ID);

    expect(result).toEqual(mockResponse);
    expect(unwrap).toHaveBeenCalledWith({
      success: true,
      data: mockResponse,
    });
  });

  it('propagates errors thrown by unwrap (e.g. 404 / 409)', async () => {
    const err = new Error('CLAUSE_NOT_FOUND');
    (httpService.get as Mock).mockResolvedValue({ success: false });
    (unwrap as Mock).mockImplementation(() => {
      throw err;
    });

    await expect(similarClausesService.getSimilar(SOURCE_ID)).rejects.toThrow(
      'CLAUSE_NOT_FOUND',
    );
  });
});
