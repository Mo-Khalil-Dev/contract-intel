import { Inject, Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import {
  AnswerRequest,
  AnswerResult,
  IClaudeAnswerService,
} from '../../application/ports/claude-answer.service';

export const CHAT_ANTHROPIC_CLIENT = Symbol('CHAT_ANTHROPIC_CLIENT');
export const CHAT_CLAUDE_MODEL = Symbol('CHAT_CLAUDE_MODEL');

const MAX_OUTPUT_TOKENS = 1024;

/**
 * Production answer driver (Phase 12, Task 12.2). One Anthropic Messages
 * call per question; the system prompt is marked `cache_control:
 * ephemeral` so the static grounding rules are read from prompt cache on
 * every call after the first. Boundary contract is the
 * {@link IClaudeAnswerService} port — the application layer is identical
 * between this and the stub.
 */
@Injectable()
export class AnthropicClaudeAnswerService implements IClaudeAnswerService {
  constructor(
    @Inject(CHAT_ANTHROPIC_CLIENT) private readonly client: Anthropic,
    @Inject(CHAT_CLAUDE_MODEL) private readonly model: string,
  ) {}

  async answer(request: AnswerRequest): Promise<AnswerResult> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        {
          type: 'text',
          text: request.system,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: request.user }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
