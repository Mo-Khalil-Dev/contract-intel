/**
 * Port for producing a grounded natural-language answer from a built
 * prompt (Phase 12, Task 12.2). The Anthropic driver lives in
 * infrastructure; a deterministic stub backs the unit tests. The
 * application layer only ever sees this interface.
 */

export const CLAUDE_ANSWER_SERVICE = Symbol('CLAUDE_ANSWER_SERVICE');

export interface AnswerRequest {
  /** System prompt (cacheable static prefix + grounding rules). */
  system: string;
  /** User prompt: the question plus the serialised portfolio context. */
  user: string;
}

export interface AnswerResult {
  /** The model's prose answer, with inline [n] citation markers. */
  text: string;
  /** Token accounting for observability; absent for the stub. */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface IClaudeAnswerService {
  answer(request: AnswerRequest): Promise<AnswerResult>;
}
