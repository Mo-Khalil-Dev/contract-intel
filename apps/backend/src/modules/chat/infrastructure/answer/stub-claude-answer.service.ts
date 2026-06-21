import { Injectable } from '@nestjs/common';
import {
  AnswerRequest,
  AnswerResult,
  IClaudeAnswerService,
} from '../../application/ports/claude-answer.service';

/**
 * Deterministic stub answer service (Phase 12). Used in tests and as the
 * default driver when no Claude API key is configured, so the whole flow
 * runs locally with no external calls. It echoes a fixed grounded
 * sentence and cites the first context item, which is enough for the
 * citation pipeline and UI to exercise end-to-end.
 */
@Injectable()
export class StubClaudeAnswerService implements IClaudeAnswerService {
  answer(request: AnswerRequest): Promise<AnswerResult> {
    const mentionsContracts = /\[1\]/.test(request.user)
      ? ' Based on your portfolio, the top match is shown below [1].'
      : ' No contracts are currently in scope.';
    return Promise.resolve({
      text:
        'This is a stubbed answer for local development.' + mentionsContracts,
    });
  }
}
