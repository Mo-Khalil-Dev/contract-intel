import { Inject } from '@nestjs/common';
import { QueryType } from '../../domain/query-type';
import { ContextBuilder } from '../context/context-builder';
import { PortfolioContext } from '../context/portfolio-context';
import { buildPrompt } from '../prompts/prompt-builder';
import { extractCitations, Citation } from '../citations/citation-extractor';
import {
  AnswerRequest,
  CLAUDE_ANSWER_SERVICE,
  IClaudeAnswerService,
} from '../ports/claude-answer.service';
import { AnswerFormat, StructuredData } from './answer-format';

/** The fully-assembled answer a handler returns to the command handler. */
export interface HandledAnswer {
  prose: string;
  format: AnswerFormat;
  structuredData: StructuredData;
  citations: Citation[];
}

/**
 * One handler per {@link QueryType} (Phase 12, Task 12.4). The base class
 * owns the shared pipeline — build context → prompt → call the LLM →
 * validate citations — and each concrete handler only decides how to
 * shape the structured result (`format` + `formatResponse`).
 *
 * Adding a query type = adding a subclass and registering it. Nothing
 * else in the flow changes.
 */
export abstract class QueryHandler {
  constructor(
    protected readonly contextBuilder: ContextBuilder,
    @Inject(CLAUDE_ANSWER_SERVICE)
    protected readonly answerService: IClaudeAnswerService,
  ) {}

  /** The type this handler serves. The registry resolves on this. */
  abstract readonly type: QueryType;

  /** The result format this handler emits. */
  abstract readonly format: AnswerFormat;

  /**
   * Shape the structured payload (e.g. ranked rows) from the context and
   * the validated citations. Handlers should scope the payload to the
   * cited contracts so the table mirrors what the prose answer actually
   * references — see the risk handler.
   */
  protected abstract formatResponse(
    context: PortfolioContext,
    citations: Citation[],
  ): StructuredData;

  /** Per-type prompt. Overridable; defaults to the shared builder. */
  protected buildPrompt(context: PortfolioContext): AnswerRequest {
    return buildPrompt(context);
  }

  async handle(orgId: string, question: string): Promise<HandledAnswer> {
    const context = await this.contextBuilder.build(
      orgId,
      this.type,
      question,
    );
    const prompt = this.buildPrompt(context);
    const result = await this.answerService.answer(prompt);
    const citations = extractCitations(result.text, context);

    return {
      prose: result.text,
      format: this.format,
      structuredData: this.formatResponse(context, citations),
      citations,
    };
  }
}
