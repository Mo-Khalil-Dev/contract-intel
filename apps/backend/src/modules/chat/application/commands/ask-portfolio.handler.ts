import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AskPortfolioCommand } from './ask-portfolio.command';
import { AskResponseDto } from '../dto/ask.dto';
import { classifyQuery } from '../classification/query-classifier';
import { QueryHandlerRegistry } from '../handlers/query-handler.registry';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/chat.repository';
import { ChatThreadId } from '../../domain/value-objects/chat-thread-id.vo';
import { ChatMessageId } from '../../domain/value-objects/chat-message-id.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

/**
 * Orchestrates one Q&A turn (Phase 12, Task 12.3):
 *   classify → build context → prompt → answer → validate citations →
 *   persist user + assistant messages.
 *
 * Auth-scoped: an explicit `threadId` must belong to the caller. LLM
 * failures surface as a structured ApplicationException (mapped to a
 * clean HTTP error), never an unhandled 5xx.
 */
@CommandHandler(AskPortfolioCommand)
export class AskPortfolioHandler
  implements ICommandHandler<AskPortfolioCommand, AskResponseDto>
{
  private readonly logger = new Logger(AskPortfolioHandler.name);

  constructor(
    private readonly registry: QueryHandlerRegistry,
    @Inject(CHAT_REPOSITORY) private readonly chat: IChatRepository,
  ) {}

  async execute(command: AskPortfolioCommand): Promise<AskResponseDto> {
    const question = command.question.trim();
    if (question.length === 0) {
      throw new ApplicationException(
        'EMPTY_QUESTION',
        'Question must not be empty',
        400,
      );
    }

    const threadId = await this.resolveThread(command);
    const queryType = classifyQuery(question);

    // Persist the user's message first so it survives even if the LLM fails.
    const userSeq = await this.chat.nextSequence(threadId);
    await this.chat.appendMessage({
      id: ChatMessageId.create().value,
      threadId,
      role: 'user',
      content: question,
      sequence: userSeq,
    });

    let answer;
    try {
      answer = await this.registry.resolve(queryType).handle(
        command.orgId,
        question,
      );
    } catch (error) {
      this.logger.error(
        `Answer generation failed for thread ${threadId}: ${(error as Error).message}`,
      );
      await this.chat.appendMessage({
        id: ChatMessageId.create().value,
        threadId,
        role: 'assistant',
        content: 'I was unable to generate an answer. Please try again.',
        sequence: userSeq + 1,
        queryType,
        status: 'failed',
        failureReason: (error as Error).message,
      });
      throw new ApplicationException(
        'ANSWER_GENERATION_FAILED',
        'Unable to generate an answer right now. Please try again.',
        503,
      );
    }

    const assistantId = ChatMessageId.create().value;
    const persisted = await this.chat.appendMessage({
      id: assistantId,
      threadId,
      role: 'assistant',
      content: answer.prose,
      sequence: userSeq + 1,
      queryType,
      format: answer.format,
      structuredData: answer.structuredData,
      citations: answer.citations,
      status: 'success',
    });

    return {
      threadId,
      messageId: persisted.id,
      queryType,
      format: answer.format,
      prose: answer.prose,
      structuredData: answer.structuredData,
      citations: answer.citations,
    };
  }

  /** Validate an existing thread's ownership, or create a fresh one. */
  private async resolveThread(command: AskPortfolioCommand): Promise<string> {
    if (command.threadId) {
      const owned = await this.chat.threadBelongsToUser(
        command.threadId,
        command.userId,
      );
      if (!owned) {
        throw new ApplicationException(
          'CHAT_THREAD_NOT_FOUND',
          `Thread ${command.threadId} not found`,
          404,
        );
      }
      return command.threadId;
    }

    const threadId = ChatThreadId.create().value;
    await this.chat.createThread({
      id: threadId,
      userId: command.userId,
      orgId: command.orgId,
      title: command.question.trim().slice(0, 80),
      portfolioSnapshot: [],
    });
    return threadId;
  }
}
