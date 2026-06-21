import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { InfrastructureException } from '../../../../shared/exceptions/app-error';
import {
  AppendMessageInput,
  CreateThreadInput,
  IChatRepository,
  PersistedMessage,
} from '../../domain/chat.repository';

@Injectable()
export class PrismaChatRepository implements IChatRepository {
  private readonly logger = new Logger(PrismaChatRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async createThread(input: CreateThreadInput): Promise<void> {
    try {
      await this.prisma.chatThread.create({
        data: {
          id: input.id,
          userId: input.userId,
          orgId: input.orgId,
          title: input.title,
          portfolioSnapshot: input.portfolioSnapshot,
          status: 'active',
        },
      });
    } catch (error) {
      throw this.wrap('CHAT_THREAD_CREATE_FAILED', error);
    }
  }

  async nextSequence(threadId: string): Promise<number> {
    const last = await this.prisma.chatMessage.findFirst({
      where: { threadId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    return (last?.sequence ?? 0) + 1;
  }

  async appendMessage(input: AppendMessageInput): Promise<PersistedMessage> {
    try {
      const row = await this.prisma.chatMessage.create({
        data: {
          id: input.id,
          threadId: input.threadId,
          role: input.role,
          content: input.content,
          sequence: input.sequence,
          status: input.status ?? 'success',
          failureReason: input.failureReason ?? null,
          routingAnalysis: input.queryType
            ? ({ queryType: input.queryType, format: input.format } as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          citations: (input.citations ?? []) as unknown as Prisma.InputJsonValue[],
          executionMetadata:
            input.structuredData != null
              ? ({ structuredData: input.structuredData } as Prisma.InputJsonValue)
              : Prisma.JsonNull,
        },
      });
      return {
        id: row.id,
        threadId: row.threadId,
        role: row.role as 'user' | 'assistant',
        content: row.content,
        sequence: row.sequence,
        createdAt: row.createdAt,
      };
    } catch (error) {
      throw this.wrap('CHAT_MESSAGE_APPEND_FAILED', error);
    }
  }

  async threadBelongsToUser(
    threadId: string,
    userId: string,
  ): Promise<boolean> {
    const thread = await this.prisma.chatThread.findFirst({
      where: { id: threadId, userId },
      select: { id: true },
    });
    return thread !== null;
  }

  private wrap(code: string, error: unknown): InfrastructureException {
    const message = (error as Error).message;
    this.logger.error(`${code}: ${message}`);
    return new InfrastructureException(code, message);
  }
}
