/**
 * askService — Phase 12 (Requirement 15) "Ask Your Portfolio".
 *
 *   - POST /api/v1/ask → AskResponse
 *
 * 3-tier API stack:
 *   useAskPortfolio → askService → httpService → axios
 *
 * Unwraps the ApiResponse<T> envelope; the hook consumes AskResponse
 * directly. Throws an AppError on any failure (empty question, thread
 * not found, LLM outage).
 */

import { httpService } from '@/api/httpService';
import { unwrap } from '@/api/unwrap';
import { API } from '@/api/endpoints';
import type { AskRequest, AskResponse } from '@/types/ask';

export const askService = {
  async ask(request: AskRequest): Promise<AskResponse> {
    return httpService.post<AskResponse>(API.ASK, request).then(unwrap);
  },
};
