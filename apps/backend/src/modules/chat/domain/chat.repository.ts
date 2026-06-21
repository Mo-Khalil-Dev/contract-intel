import { QueryType } from './query-type';
import { Citation } from '../application/citations/citation-extractor';
import { AnswerFormat, StructuredData } from '../application/handlers/answer-format';

export const CHAT_REPOSITORY = Symbol('CHAT_REPOSITORY');

/** A persisted message, returned after a write for the response envelope. */
export interface PersistedMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
  createdAt: Date;
}

export interface CreateThreadInput {
  id: string;
  userId: string;
  orgId: string;
  title: string | null;
  portfolioSnapshot: string[];
}

export interface AppendMessageInput {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
  /** Assistant-only metadata; omitted/empty for user messages. */
  queryType?: QueryType;
  format?: AnswerFormat;
  structuredData?: StructuredData;
  citations?: Citation[];
  status?: 'success' | 'pending' | 'failed';
  failureReason?: string;
}

/**
 * Write+read port for chat persistence (Phase 12). Threads aggregate
 * messages; messages are immutable once written. All reads are
 * caller-scoped by userId — the controller passes the authenticated user.
 */
export interface IChatRepository {
  createThread(input: CreateThreadInput): Promise<void>;
  /** Next 1-based sequence number for a thread (1 when empty). */
  nextSequence(threadId: string): Promise<number>;
  appendMessage(input: AppendMessageInput): Promise<PersistedMessage>;
  /** True when the thread exists and belongs to the user. */
  threadBelongsToUser(threadId: string, userId: string): Promise<boolean>;
}
