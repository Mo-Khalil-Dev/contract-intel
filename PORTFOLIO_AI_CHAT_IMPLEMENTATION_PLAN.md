# "Talk to Your Portfolio" AI Chat Feature - Implementation Plan

## Executive Summary

This document provides a detailed, 3-phase implementation plan for building an AI-powered chat interface that allows users to ask natural language questions about their contract portfolio. The feature integrates with the existing NestJS/React contract analysis platform, leveraging the CQRS pattern, Prisma ORM, and React Query infrastructure.

**Timeline**: 1-3 weeks per phase | **Total Duration**: 6-9 weeks

**Key Objectives**:
- Enable conversational queries across the portfolio (documents, clauses, risk analysis)
- Leverage existing query infrastructure and Claude AI backend
- Maintain Clean Architecture and CQRS patterns
- Implement with comprehensive testing and error handling
- Provide real-time chat UX with streaming responses

---

## Phase 1: Foundation & Infrastructure (Weeks 1-2)

### Goals
- Establish chat domain model and database schema
- Create base query handler for AI message processing
- Build HTTP API endpoints for chat operations
- Setup frontend chat UI components and state management
- Create comprehensive testing framework

### Deliverables

#### 1.1 Backend Database Schema

**File**: `apps/backend/prisma/schema.prisma`

Add the following models to support chat functionality:

```prisma
// ─────────────────────────────────────────────────────────────────────
// Chat domain (Phase 12 – "Talk to Your Portfolio")
// ─────────────────────────────────────────────────────────────────────

// Thread aggregates a conversation session between user and AI assistant.
// One row per conversation; users can have multiple active threads.
model ChatThread {
  id            String    @id // UUID, supplied by the application (ThreadId VO)
  userId        String    // FK to User
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  orgId         String    // v1: orgId == userId. Will become a real Org FK later.
  
  title         String?   // Auto-generated from first user message or manually set
  status        String    @default("active") // active | archived | deleted
  
  // Portfolio context snapshot at thread creation. Used for:
  // - Audit trail (which documents were in scope when the question was asked)
  // - Scope limiting (if user deletes docs mid-conversation, we know what was visible)
  // Stored as JSON array of document IDs for Phase 12; Phase 13+ may normalize.
  portfolioSnapshot Json?
  
  // Model/settings snapshot at thread creation (for reproducibility audit)
  // { llmModel: 'claude-3-5-sonnet', temperature: 0.7, ... }
  settingsSnapshot Json?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  archivedAt    DateTime?
  
  messages      ChatMessage[]
  
  @@index([userId])
  @@index([orgId])
  @@index([status])
  @@index([createdAt])
}

// Position-anchored message in a thread. Immutable once created.
// User and AI messages live in the same table; `role` disambiguates.
model ChatMessage {
  id            String    @id // UUID, supplied by the application (MessageId VO)
  threadId      String
  thread        ChatThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  
  // Message metadata
  role          String    // "user" | "assistant"
  content       String    @db.Text // The actual message body
  sequence      Int       // Per-thread sequence number for ordering (1, 2, 3, ...)
  
  // For user messages: the original query (for audit/replay)
  // For assistant messages: the query that produced this response (nullable if error)
  querySnapshot Json?
  
  // For assistant messages: structured analysis of how the question was routed
  // { queryType: "financial", clauses: ["payment-terms"], documents: [ids], ...}
  routingAnalysis Json?
  
  // For assistant messages: references to source clauses/documents cited in the response
  // [ { type: "clause", id: "...", text: "...", relevance: 0.92 }, ... ]
  citations     Json[]    @default([])
  
  // Execution metadata (for debugging)
  // { llmInputTokens: 1234, llmOutputTokens: 567, executionTimeMs: 3421 }
  executionMetadata Json?
  
  // If message creation failed (e.g., LLM outage), error details
  failureReason String?
  status        String    @default("success") // success | pending | failed
  
  createdAt     DateTime  @default(now())
  
  @@index([threadId, sequence])
  @@index([role])
  @@index([status])
}

// Feedback on individual messages (thumbs up/down + optional comment)
// Used to improve response quality over time.
model ChatFeedback {
  id            String    @id // UUID
  messageId     String    @unique
  message       ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  // 1 = helpful, -1 = unhelpful, 0 = neutral
  score         Int       // Range: -1..1
  comment       String?   @db.Text
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Update the User model to add the relation:
// (in the existing User model, add this line)
// chatThreads   ChatThread[]
```

**Migrations**:
```bash
npx prisma migrate dev --name add_chat_schema
```

**Schema Rationale**:
- **ChatThread**: Organizes messages into conversations; portfolio snapshot enables audit trail
- **ChatMessage**: Role-based (user/assistant) enables conversational flow; citations track provenance
- **ChatFeedback**: Enables continuous improvement; separate table keeps message immutable
- **JSON fields**: Portfolio snapshot, routing analysis, execution metadata allow schema flexibility while supporting future normalization

#### 1.2 Backend Module Structure

Create `/apps/backend/src/modules/chat/` with the following structure:

```
apps/backend/src/modules/chat/
├── domain/
│   ├── chat-thread/
│   │   ├── chat-thread.aggregate.ts
│   │   ├── chat-thread.repository.ts
│   │   ├── chat-thread-id.vo.ts
│   │   └── __tests__/
│   │       └── chat-thread.aggregate.spec.ts
│   ├── chat-message/
│   │   ├── chat-message.entity.ts
│   │   ├── message-id.vo.ts
│   │   ├── message-role.vo.ts
│   │   └── __tests__/
│   │       └── chat-message.entity.spec.ts
│   ├── value-objects/
│   │   ├── thread-title.vo.ts
│   │   └── execution-metadata.vo.ts
│   └── ports/
│       ├── llm-service.port.ts
│       └── message-repository.ts
├── application/
│   ├── commands/
│   │   ├── start-chat-thread.command.ts
│   │   ├── start-chat-thread.handler.ts
│   │   ├── add-message-to-thread.command.ts
│   │   ├── add-message-to-thread.handler.ts
│   │   └── __tests__/
│   │       ├── start-chat-thread.handler.spec.ts
│   │       └── add-message-to-thread.handler.spec.ts
│   ├── queries/
│   │   ├── get-chat-thread.query.ts
│   │   ├── get-chat-thread.handler.ts
│   │   ├── list-chat-threads.query.ts
│   │   ├── list-chat-threads.handler.ts
│   │   ├── chat-with-ai.query.ts          // NEW: the core chat query
│   │   ├── chat-with-ai.handler.ts        // NEW: orchestrates query routing
│   │   └── __tests__/
│   │       ├── chat-with-ai.handler.spec.ts
│   │       └── get-chat-thread.handler.spec.ts
│   ├── event-handlers/
│   │   ├── on-message-created.handler.ts
│   │   └── __tests__/
│   │       └── on-message-created.handler.spec.ts
│   └── services/
│       ├── query-router.service.ts        // Routes questions to specialized handlers
│       ├── response-formatter.service.ts  // Formats LLM output into citations
│       └── portfolio-context.service.ts   // Loads portfolio data for LLM context
├── infrastructure/
│   ├── chat.controller.ts
│   ├── chat.module.ts
│   ├── dtos/
│   │   ├── start-thread.request.dto.ts
│   │   ├── send-message.request.dto.ts
│   │   ├── chat-message.response.dto.ts
│   │   ├── chat-thread.response.dto.ts
│   │   └── chat-streaming.response.dto.ts // For SSE streaming
│   ├── persistence/
│   │   ├── prisma-chat-thread.repository.ts
│   │   └── prisma-chat-message.repository.ts
│   ├── llm/
│   │   ├── claude-llm-service.ts          // Production driver
│   │   ├── mock-llm-service.ts            // Mock for testing
│   │   └── llm-service.factory.ts
│   ├── mappers/
│   │   ├── chat-thread.mapper.ts
│   │   └── chat-message.mapper.ts
│   └── __tests__/
│       ├── chat.controller.spec.ts
│       └── integration/
│           └── chat-workflow.integration.spec.ts
└── README.md                               // Module documentation
```

#### 1.3 Value Objects

**File**: `apps/backend/src/modules/chat/domain/chat-thread/chat-thread-id.vo.ts`

```typescript
import { v4 as uuid } from 'uuid';

export class ChatThreadId {
  readonly value: string;

  private constructor(value: string) {
    if (!this.isValidUuid(value)) {
      throw new Error(`Invalid ChatThreadId: ${value}`);
    }
    this.value = value;
  }

  static create(): ChatThreadId {
    return new ChatThreadId(uuid());
  }

  static fromString(value: string): ChatThreadId {
    return new ChatThreadId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ChatThreadId): boolean {
    return this.value === other.value;
  }

  private isValidUuid(value: string): boolean {
    const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidv4Regex.test(value);
  }
}
```

**File**: `apps/backend/src/modules/chat/domain/chat-message/message-id.vo.ts`

```typescript
import { v4 as uuid } from 'uuid';

export class MessageId {
  readonly value: string;

  private constructor(value: string) {
    if (!this.isValidUuid(value)) {
      throw new Error(`Invalid MessageId: ${value}`);
    }
    this.value = value;
  }

  static create(): MessageId {
    return new MessageId(uuid());
  }

  static fromString(value: string): MessageId {
    return new MessageId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MessageId): boolean {
    return this.value === other.value;
  }

  private isValidUuid(value: string): boolean {
    const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidv4Regex.test(value);
  }
}
```

**File**: `apps/backend/src/modules/chat/domain/chat-message/message-role.vo.ts`

```typescript
export type MessageRoleType = 'user' | 'assistant';

export class MessageRole {
  readonly value: MessageRoleType;

  private constructor(value: MessageRoleType) {
    this.value = value;
  }

  static user(): MessageRole {
    return new MessageRole('user');
  }

  static assistant(): MessageRole {
    return new MessageRole('assistant');
  }

  static fromString(value: string): MessageRole {
    if (value !== 'user' && value !== 'assistant') {
      throw new Error(`Invalid MessageRole: ${value}`);
    }
    return new MessageRole(value as MessageRoleType);
  }

  toString(): string {
    return this.value;
  }

  isUser(): boolean {
    return this.value === 'user';
  }

  isAssistant(): boolean {
    return this.value === 'assistant';
  }
}
```

#### 1.4 Domain Model: ChatThread Aggregate

**File**: `apps/backend/src/modules/chat/domain/chat-thread/chat-thread.aggregate.ts`

```typescript
import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { ChatThreadId } from './chat-thread-id.vo';
import { MessageId } from '../chat-message/message-id.vo';
import { MessageRole } from '../chat-message/message-role.vo';
import { UserId } from '../../../auth/domain/value-objects/user-id.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

export interface ChatThreadProps {
  id: ChatThreadId;
  userId: UserId;
  orgId: string;
  title?: string;
  status: 'active' | 'archived' | 'deleted';
  portfolioSnapshot?: unknown;
  settingsSnapshot?: unknown;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export class ChatThread extends AggregateRoot<ChatThreadProps> {
  static create(props: Omit<ChatThreadProps, 'createdAt' | 'updatedAt'>): ChatThread {
    const chatThread = new ChatThread({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // Emit ThreadStartedEvent
    chatThread.addDomainEvent({
      aggregateId: props.id.toString(),
      eventType: 'ThreadStarted',
      timestamp: new Date(),
      payload: props,
    });
    return chatThread;
  }

  addUserMessage(messageId: MessageId, content: string, querySnapshot?: unknown): void {
    if (this.props.status !== 'active') {
      throw new DomainException('THREAD_NOT_ACTIVE', 'Cannot add message to inactive thread');
    }
    this.addDomainEvent({
      aggregateId: this.props.id.toString(),
      eventType: 'UserMessageAdded',
      timestamp: new Date(),
      payload: { messageId, content, querySnapshot },
    });
  }

  addAssistantMessage(
    messageId: MessageId,
    content: string,
    citations: unknown[],
    executionMetadata?: unknown,
  ): void {
    if (this.props.status !== 'active') {
      throw new DomainException('THREAD_NOT_ACTIVE', 'Cannot add message to inactive thread');
    }
    this.addDomainEvent({
      aggregateId: this.props.id.toString(),
      eventType: 'AssistantMessageAdded',
      timestamp: new Date(),
      payload: { messageId, content, citations, executionMetadata },
    });
  }

  archive(): void {
    if (this.props.status === 'archived') {
      throw new DomainException('THREAD_ALREADY_ARCHIVED', 'Thread is already archived');
    }
    this.props.status = 'archived';
    this.props.archivedAt = new Date();
    this.addDomainEvent({
      aggregateId: this.props.id.toString(),
      eventType: 'ThreadArchived',
      timestamp: new Date(),
      payload: {},
    });
  }

  getTitle(): string {
    return this.props.title || 'Untitled Conversation';
  }

  setTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new DomainException('INVALID_TITLE', 'Title cannot be empty');
    }
    this.props.title = title;
  }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  getPortfolioSnapshot(): unknown {
    return this.props.portfolioSnapshot;
  }
}
```

#### 1.5 Domain Ports

**File**: `apps/backend/src/modules/chat/domain/ports/llm-service.port.ts`

```typescript
import { MessageRole } from '../chat-message/message-role.vo';

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmRequest {
  messages: LlmMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LlmResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface ILlmService {
  chat(request: LlmRequest): Promise<LlmResponse>;
  chatStream(request: LlmRequest): AsyncGenerator<string, void, unknown>;
}

export const LLM_SERVICE = Symbol('ILlmService');
```

**File**: `apps/backend/src/modules/chat/domain/ports/message-repository.ts`

```typescript
import { MessageId } from '../chat-message/message-id.vo';
import { ChatThreadId } from '../chat-thread/chat-thread-id.vo';
import { MessageRole } from '../chat-message/message-role.vo';

export interface IChatMessageRepository {
  save(
    messageId: MessageId,
    threadId: ChatThreadId,
    role: MessageRole,
    content: string,
    sequence: number,
    citations: unknown[],
    executionMetadata?: unknown,
    querySnapshot?: unknown,
  ): Promise<void>;

  getByThreadId(threadId: ChatThreadId): Promise<
    Array<{
      id: string;
      role: string;
      content: string;
      sequence: number;
      citations: unknown[];
      createdAt: Date;
    }>
  >;

  getById(messageId: MessageId): Promise<{
    id: string;
    threadId: string;
    role: string;
    content: string;
    sequence: number;
  } | null>;
}

export const CHAT_MESSAGE_REPOSITORY = Symbol('IChatMessageRepository');
```

#### 1.6 Application Layer: Query Handler

**File**: `apps/backend/src/modules/chat/application/queries/chat-with-ai.query.ts`

```typescript
export class ChatWithAiQuery {
  constructor(
    readonly threadId: string,
    readonly userMessage: string,
    readonly userId: string,
    readonly orgId: string,
  ) {}
}

export interface Citation {
  type: 'clause' | 'document' | 'reference';
  id: string;
  title?: string;
  relevance: number; // 0..1
  excerpt?: string; // First 200 chars of cited content
}

export interface ChatWithAiResult {
  messageId: string;
  content: string;
  citations: Citation[];
  executionTimeMs: number;
}
```

**File**: `apps/backend/src/modules/chat/application/queries/chat-with-ai.handler.ts`

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ChatWithAiQuery, ChatWithAiResult } from './chat-with-ai.query';
import { ILlmService, LLM_SERVICE } from '../../domain/ports/llm-service.port';
import { CHAT_MESSAGE_REPOSITORY, IChatMessageRepository } from '../../domain/ports/message-repository';
import { QueryRouter } from '../services/query-router.service';
import { ResponseFormatter } from '../services/response-formatter.service';
import { PortfolioContext } from '../services/portfolio-context.service';
import { MessageId } from '../../domain/chat-message/message-id.vo';
import { MessageRole } from '../../domain/chat-message/message-role.vo';
import { ChatThreadId } from '../../domain/chat-thread/chat-thread-id.vo';

@QueryHandler(ChatWithAiQuery)
@Injectable()
export class ChatWithAiHandler implements IQueryHandler<ChatWithAiQuery, ChatWithAiResult> {
  constructor(
    @Inject(LLM_SERVICE) private readonly llmService: ILlmService,
    @Inject(CHAT_MESSAGE_REPOSITORY) private readonly messageRepo: IChatMessageRepository,
    private readonly queryRouter: QueryRouter,
    private readonly responseFormatter: ResponseFormatter,
    private readonly portfolioContext: PortfolioContext,
  ) {}

  async execute(query: ChatWithAiQuery): Promise<ChatWithAiResult> {
    const startTime = Date.now();
    const messageId = MessageId.create();

    try {
      // 1. Load thread history
      const threadId = ChatThreadId.fromString(query.threadId);
      const history = await this.messageRepo.getByThreadId(threadId);

      // 2. Load portfolio context (documents, clauses, risk scores)
      const portfolioData = await this.portfolioContext.loadForOrg(query.orgId);

      // 3. Route the query to specialized handlers (financial, risk, etc.)
      const routing = this.queryRouter.route(query.userMessage, portfolioData);

      // 4. Build system prompt based on routing
      const systemPrompt = this.buildSystemPrompt(routing, portfolioData);

      // 5. Call LLM with history + new message
      const llmMessages = [
        ...history.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
        { role: 'user' as const, content: query.userMessage },
      ];

      const llmResponse = await this.llmService.chat({
        messages: llmMessages,
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt,
      });

      // 6. Parse response and extract citations
      const { content, citations } = this.responseFormatter.format(
        llmResponse.content,
        routing,
        portfolioData,
      );

      // 7. Persist message
      const nextSequence = history.length + 1;
      await this.messageRepo.save(
        messageId,
        threadId,
        MessageRole.assistant(),
        content,
        nextSequence,
        citations,
        {
          llmInputTokens: llmResponse.inputTokens,
          llmOutputTokens: llmResponse.outputTokens,
          executionTimeMs: Date.now() - startTime,
        },
        { routing },
      );

      return {
        messageId: messageId.toString(),
        content,
        citations,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      // Persist error state to message
      await this.messageRepo.save(
        messageId,
        ChatThreadId.fromString(query.threadId),
        MessageRole.assistant(),
        `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        [],
        undefined,
        { error: error instanceof Error ? error.message : 'Unknown error' },
      );
      throw error;
    }
  }

  private buildSystemPrompt(routing: unknown, portfolioData: unknown): string {
    // Compose system prompt based on route + context
    return `You are an expert contract analyst. You have access to the user's portfolio.
Answer questions about their contracts concisely and accurately. Always cite specific
clauses or documents when making claims.`;
  }
}
```

#### 1.7 Application Services

**File**: `apps/backend/src/modules/chat/application/services/query-router.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

export type QueryType = 'financial' | 'risk' | 'timeline' | 'comparison' | 'clause-search' | 'general';

export interface RoutingResult {
  type: QueryType;
  confidence: number; // 0..1
  relevantFields: string[];
  targetDocuments?: string[]; // If scoped to specific docs
  targetClauses?: string[]; // If scoped to specific clause types
}

@Injectable()
export class QueryRouter {
  route(userMessage: string, portfolioData: unknown): RoutingResult {
    // Simple keyword-based routing; Phase 13 may upgrade to LLM-based
    const lowerMessage = userMessage.toLowerCase();

    if (this.isFinancialQuery(lowerMessage)) {
      return {
        type: 'financial',
        confidence: 0.9,
        relevantFields: ['payment-terms', 'pricing', 'currency', 'renewal-terms'],
      };
    }

    if (this.isRiskQuery(lowerMessage)) {
      return {
        type: 'risk',
        confidence: 0.85,
        relevantFields: ['liability', 'indemnification', 'warranty', 'termination-rights'],
      };
    }

    if (this.isTimelineQuery(lowerMessage)) {
      return {
        type: 'timeline',
        confidence: 0.8,
        relevantFields: ['dates', 'milestones', 'renewal', 'termination'],
      };
    }

    return {
      type: 'general',
      confidence: 0.5,
      relevantFields: [],
    };
  }

  private isFinancialQuery(msg: string): boolean {
    return /\b(price|cost|payment|revenue|financial|budget|margin|discount)\b/i.test(msg);
  }

  private isRiskQuery(msg: string): boolean {
    return /\b(risk|liability|indemnif|warrant|breach|penalty|damage|limit)\b/i.test(msg);
  }

  private isTimelineQuery(msg: string): boolean {
    return /\b(when|date|deadline|expir|renew|term|period)\b/i.test(msg);
  }
}
```

**File**: `apps/backend/src/modules/chat/application/services/response-formatter.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

export interface Citation {
  type: 'clause' | 'document';
  id: string;
  title?: string;
  relevance: number;
  excerpt?: string;
}

@Injectable()
export class ResponseFormatter {
  format(
    llmContent: string,
    routing: unknown,
    portfolioData: unknown,
  ): { content: string; citations: Citation[] } {
    // Phase 12: Extract citations from text patterns (e.g., [Clause: XYZ])
    // Phase 13: Upgrade to structured output via Claude's tools API
    const citations = this.extractCitations(llmContent);
    const cleanedContent = this.removeMetadataTags(llmContent);

    return {
      content: cleanedContent,
      citations,
    };
  }

  private extractCitations(content: string): Citation[] {
    const citations: Citation[] = [];
    const clausePattern = /\[Clause:\s*([a-f0-9-]+)\]/g;
    let match;

    while ((match = clausePattern.exec(content)) !== null) {
      citations.push({
        type: 'clause',
        id: match[1],
        relevance: 0.9,
      });
    }

    return citations;
  }

  private removeMetadataTags(content: string): string {
    return content.replace(/\[Clause:\s*[a-f0-9-]+\]/g, '').trim();
  }
}
```

**File**: `apps/backend/src/modules/chat/application/services/portfolio-context.service.ts`

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DOCUMENT_LIST_ITEM_REPOSITORY, IDocumentListItemRepository } from '../../../documents/application/projections/document-list-item/document-list-item.repository';
import { GetClausesForDocumentQuery } from '../../../clauses/application/queries/get-clauses-for-document.query';

@Injectable()
export class PortfolioContext {
  constructor(
    @Inject(DOCUMENT_LIST_ITEM_REPOSITORY) private readonly docRepo: IDocumentListItemRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async loadForOrg(orgId: string): Promise<unknown> {
    // Load all documents + their clauses for the org
    // This is passed as context to the LLM (truncated for token limits)
    // In Phase 13, may implement RAG instead
    const documents = await this.docRepo.findByOrgId(orgId);
    
    const documentsWithClauses = await Promise.all(
      documents.map(async doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        riskScore: doc.riskScore,
        clauses: await this.queryBus.execute(new GetClausesForDocumentQuery(doc.id)),
      })),
    );

    return {
      documents: documentsWithClauses,
      stats: {
        totalDocuments: documents.length,
        averageRiskScore: documents.reduce((sum, d) => sum + (d.riskScore || 0), 0) / documents.length,
      },
    };
  }
}
```

#### 1.8 Infrastructure: Chat Controller

**File**: `apps/backend/src/modules/chat/infrastructure/chat.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
  CurrentUser,
  RequestUser,
} from '../../auth/infrastructure/decorators/current-user.decorator';
import { StartChatThreadCommand } from '../application/commands/start-chat-thread.command';
import { ChatWithAiQuery, ChatWithAiResult } from '../application/queries/chat-with-ai.query';
import { ListChatThreadsQuery } from '../application/queries/list-chat-threads.query';
import { GetChatThreadQuery } from '../application/queries/get-chat-thread.query';
import type { ChatThreadResponse } from './dtos/chat-thread.response.dto';
import type { ChatMessageResponse } from './dtos/chat-message.response.dto';
import type { SendMessageRequest } from './dtos/send-message.request.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /api/v1/chat/threads
   * Start a new conversation thread
   */
  @Post('threads')
  @HttpCode(HttpStatus.CREATED)
  async startThread(
    @CurrentUser() user: RequestUser,
  ): Promise<ChatThreadResponse> {
    const result = await this.commandBus.execute(
      new StartChatThreadCommand(user.userId),
    );
    return {
      id: result.threadId,
      title: result.title,
      createdAt: result.createdAt.toISOString(),
      status: 'active',
      messages: [],
    };
  }

  /**
   * GET /api/v1/chat/threads
   * List all conversation threads for the user
   */
  @Get('threads')
  async listThreads(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ): Promise<ChatThreadResponse[]> {
    return this.queryBus.execute(
      new ListChatThreadsQuery(
        user.userId,
        parseInt(limit),
        parseInt(offset),
      ),
    );
  }

  /**
   * GET /api/v1/chat/threads/:threadId
   * Get a specific thread with all messages
   */
  @Get('threads/:threadId')
  async getThread(
    @CurrentUser() user: RequestUser,
    @Param('threadId') threadId: string,
  ): Promise<ChatThreadResponse> {
    return this.queryBus.execute(
      new GetChatThreadQuery(threadId, user.userId),
    );
  }

  /**
   * POST /api/v1/chat/threads/:threadId/messages
   * Send a message and get AI response
   */
  @Post('threads/:threadId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'AI response with citations' })
  async sendMessage(
    @CurrentUser() user: RequestUser,
    @Param('threadId') threadId: string,
    @Body() body: SendMessageRequest,
  ): Promise<ChatMessageResponse> {
    const result = await this.queryBus.execute(
      new ChatWithAiQuery(
        threadId,
        body.message,
        user.userId,
        user.userId, // v1: orgId == userId
      ),
    );

    return {
      id: result.messageId,
      role: 'assistant',
      content: result.content,
      citations: result.citations,
      createdAt: new Date().toISOString(),
      executionTimeMs: result.executionTimeMs,
    };
  }
}
```

#### 1.9 Infrastructure: Chat Module

**File**: `apps/backend/src/modules/chat/infrastructure/chat.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from '../../config/app-config.module';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { DocumentsModule } from '../documents/documents.module';
import { ClausesModule } from '../clauses/clauses.module';

// Application
import { StartChatThreadHandler } from './application/commands/start-chat-thread.handler';
import { ChatWithAiHandler } from './application/queries/chat-with-ai.handler';
import { ListChatThreadsHandler } from './application/queries/list-chat-threads.handler';
import { GetChatThreadHandler } from './application/queries/get-chat-thread.handler';

// Application Services
import { QueryRouter } from './application/services/query-router.service';
import { ResponseFormatter } from './application/services/response-formatter.service';
import { PortfolioContext } from './application/services/portfolio-context.service';

// Infrastructure
import { ChatController } from './infrastructure/chat.controller';
import { PrismaChatThreadRepository } from './infrastructure/persistence/prisma-chat-thread.repository';
import { PrismaChatMessageRepository } from './infrastructure/persistence/prisma-chat-message.repository';
import { ClaudeLlmService } from './infrastructure/llm/claude-llm-service';
import { MockLlmService } from './infrastructure/llm/mock-llm-service';

// Ports
import { CHAT_THREAD_REPOSITORY } from './domain/chat-thread/chat-thread.repository';
import { CHAT_MESSAGE_REPOSITORY } from './domain/ports/message-repository';
import { LLM_SERVICE } from './domain/ports/llm-service.port';

// Config
import { AppConfigService } from '../../config/app-config.service';

@Module({
  imports: [CqrsModule, AppConfigModule, PrismaModule, DocumentsModule, ClausesModule],
  controllers: [ChatController],
  providers: [
    // Application
    StartChatThreadHandler,
    ChatWithAiHandler,
    ListChatThreadsHandler,
    GetChatThreadHandler,

    // Services
    QueryRouter,
    ResponseFormatter,
    PortfolioContext,

    // Persistence
    { provide: CHAT_THREAD_REPOSITORY, useClass: PrismaChatThreadRepository },
    { provide: CHAT_MESSAGE_REPOSITORY, useClass: PrismaChatMessageRepository },

    // LLM driver (swappable via factory)
    ClaudeLlmService,
    MockLlmService,
    {
      provide: LLM_SERVICE,
      inject: [AppConfigService, ClaudeLlmService, MockLlmService],
      useFactory: (
        config: AppConfigService,
        claude: ClaudeLlmService,
        mock: MockLlmService,
      ) => {
        if (config.environment === 'test') {
          return mock;
        }
        return claude;
      },
    },
  ],
})
export class ChatModule {}
```

#### 1.10 Frontend: Chat Hook

**File**: `apps/frontend/src/hooks/useChat.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { chatService } from '@/services/chatService';
import type { ChatThread, ChatMessage } from '@/types/chat';

export function useListChatThreads(enabled = true) {
  return useQuery<ChatThread[]>(
    ['chat', 'threads'],
    () => chatService.listThreads(),
    {
      enabled,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  );
}

export function useGetChatThread(threadId: string | undefined) {
  return useQuery<ChatThread>(
    ['chat', 'thread', threadId],
    () => chatService.getThread(threadId as string),
    {
      enabled: Boolean(threadId),
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  );
}

export function useStartChatThread() {
  const queryClient = useQueryClient();

  return useMutation(
    async () => chatService.startThread(),
    {
      onSuccess: (newThread) => {
        queryClient.setQueryData(['chat', 'threads'], (old: ChatThread[]) => [
          newThread,
          ...old,
        ]);
      },
    },
  );
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ threadId, message }: { threadId: string; message: string }) =>
      chatService.sendMessage(threadId, message),
    {
      onSuccess: (response, { threadId }) => {
        queryClient.setQueryData(['chat', 'thread', threadId], (old: ChatThread) => ({
          ...old,
          messages: [...old.messages, response],
        }));
      },
    },
  );
}
```

#### 1.11 Frontend: Chat Service

**File**: `apps/frontend/src/services/chatService.ts`

```typescript
import { httpService } from './httpService';
import { API } from '@/api/endpoints';
import type { ChatThread, ChatMessage } from '@/types/chat';

export const chatService = {
  listThreads: async (): Promise<ChatThread[]> => {
    const response = await httpService.get(`${API.CHAT.THREADS}`);
    return response.data;
  },

  startThread: async (): Promise<ChatThread> => {
    const response = await httpService.post(`${API.CHAT.THREADS}`, {});
    return response.data;
  },

  getThread: async (threadId: string): Promise<ChatThread> => {
    const response = await httpService.get(`${API.CHAT.THREADS}/${threadId}`);
    return response.data;
  },

  sendMessage: async (threadId: string, message: string): Promise<ChatMessage> => {
    const response = await httpService.post(
      `${API.CHAT.THREADS}/${threadId}/messages`,
      { message },
    );
    return response.data;
  },
};
```

#### 1.12 Frontend: Chat UI Components (Basic)

**File**: `apps/frontend/src/components/chat/ChatThread.tsx`

```typescript
import React, { useState } from 'react';
import { useGetChatThread, useSendChatMessage } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatThreadProps {
  threadId: string;
}

export const ChatThread: React.FC<ChatThreadProps> = ({ threadId }) => {
  const { data: thread, isLoading } = useGetChatThread(threadId);
  const sendMutation = useSendChatMessage();
  const [inputValue, setInputValue] = useState('');

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    await sendMutation.mutateAsync({
      threadId,
      message: inputValue,
    });
    setInputValue('');
  };

  if (isLoading) return <div>Loading conversation...</div>;
  if (!thread) return <div>Thread not found</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        isLoading={sendMutation.isLoading}
      />
    </div>
  );
};
```

#### 1.13 Types

**File**: `apps/frontend/src/types/chat.ts`

```typescript
export interface Citation {
  type: 'clause' | 'document';
  id: string;
  title?: string;
  relevance: number;
  excerpt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  createdAt: string;
  executionTimeMs?: number;
}

export interface ChatThread {
  id: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
  messages: ChatMessage[];
}
```

#### 1.14 API Endpoints

**Update**: `apps/frontend/src/api/endpoints.ts`

```typescript
// Add to existing API object:
CHAT: {
  THREADS: '/api/v1/chat/threads',
  THREAD: (id: string) => `/api/v1/chat/threads/${id}`,
  MESSAGES: (threadId: string) => `/api/v1/chat/threads/${threadId}/messages`,
}
```

#### 1.15 Update Main App Module

**File**: `apps/backend/src/app.module.ts`

```typescript
import { ChatModule } from './modules/chat/infrastructure/chat.module';

@Module({
  imports: [
    // ... existing imports
    ChatModule,
  ],
  // ...
})
export class AppModule {}
```

### Phase 1 Testing Checklist

Backend:
- [ ] Unit tests for all VOs (ChatThreadId, MessageId, MessageRole)
- [ ] Unit tests for ChatThread aggregate (create, addMessage, archive)
- [ ] Unit tests for QueryRouter (routing logic for each query type)
- [ ] Unit tests for ResponseFormatter (citation extraction)
- [ ] Unit tests for ChatWithAiHandler (mocked LLM service)
- [ ] Integration tests for PrismaChatThreadRepository (CRUD)
- [ ] Integration tests for PrismaChatMessageRepository (sequence ordering)
- [ ] Integration test: full workflow (startThread → sendMessage → verifyPersistence)
- [ ] E2E test: POST /chat/threads → GET /chat/threads/:id → POST message → verify response

Frontend:
- [ ] Unit tests for useChat hook (mocked chatService)
- [ ] Unit tests for ChatThread component
- [ ] Unit tests for ChatMessage component
- [ ] Unit tests for ChatInput component
- [ ] Integration test: ChatThread renders messages, sends message updates UI
- [ ] Accessibility: ARIA labels on buttons/inputs, keyboard navigation

### Phase 1 Success Criteria

- All unit tests passing (target: >80% code coverage)
- Ability to start a thread, send a message, and receive an AI response
- Database schema migrations run cleanly
- No TypeScript errors or type mismatches
- Error states handled gracefully (invalid thread ID, LLM timeout, etc.)
- Message ordering correct (sequence numbers in database)

---

## Phase 2: Query Specialization & Context (Weeks 2-3)

### Goals
- Implement specialized query handlers for each query type
- Build context loading from portfolio (documents, clauses, financial data)
- Integrate with existing document/clause modules
- Implement streaming responses for better UX
- Add comprehensive error handling

### Deliverables

#### 2.1 Specialized Query Handlers

Each query type gets its own handler that transforms user questions into structured queries and invokes the appropriate domain handlers.

**File**: `apps/backend/src/modules/chat/application/services/specialized-handlers.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetDocumentListQuery } from '../../../documents/application/queries/get-document-list.query';
import { GetSimilarClausesQuery } from '../../../clauses/application/queries/get-similar-clauses.query';

export interface SpecializedQueryResult {
  data: unknown;
  queryType: string;
  executionTimeMs: number;
}

@Injectable()
export class SpecializedQueryHandlers {
  constructor(private readonly queryBus: QueryBus) {}

  async handleFinancialQuery(userMessage: string, orgId: string): Promise<SpecializedQueryResult> {
    const startTime = Date.now();
    
    // Example: Extract pricing/payment terms relevant to query
    // In Phase 13, may use LLM to extract structured financial query
    const documents = await this.queryBus.execute(
      new GetDocumentListQuery({
        orgId,
        q: this.extractFinancialKeywords(userMessage),
        sort: 'relevance',
      }),
    );

    return {
      data: documents,
      queryType: 'financial',
      executionTimeMs: Date.now() - startTime,
    };
  }

  async handleRiskQuery(userMessage: string, orgId: string): Promise<SpecializedQueryResult> {
    const startTime = Date.now();
    
    // Load all clauses and filter by risk level
    const documents = await this.queryBus.execute(
      new GetDocumentListQuery({
        orgId,
        sort: 'risk',
        risk: 'high,critical', // Filter to high-risk docs
      }),
    );

    return {
      data: documents,
      queryType: 'risk',
      executionTimeMs: Date.now() - startTime,
    };
  }

  async handleComparisonQuery(userMessage: string, orgId: string): Promise<SpecializedQueryResult> {
    const startTime = Date.now();
    
    // Extract two parties/documents from message and load both
    const parties = this.extractPartiesFromMessage(userMessage);
    
    return {
      data: { parties, comparison: {} },
      queryType: 'comparison',
      executionTimeMs: Date.now() - startTime,
    };
  }

  private extractFinancialKeywords(message: string): string {
    // Simple keyword extraction; Phase 13 may upgrade to LLM-based
    const keywords = ['price', 'payment', 'cost', 'revenue', 'budget', 'discount'];
    const matches = keywords.filter(k => message.toLowerCase().includes(k));
    return matches.join(' OR ');
  }

  private extractPartiesFromMessage(message: string): string[] {
    // Very basic; Phase 13 will need proper NER
    return [];
  }
}
```

#### 2.2 Streaming Response Handler

**File**: `apps/backend/src/modules/chat/application/queries/chat-with-ai-streaming.handler.ts`

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ChatWithAiStreamingQuery } from './chat-with-ai-streaming.query';
import { ILlmService, LLM_SERVICE } from '../../domain/ports/llm-service.port';

export class ChatWithAiStreamingQuery {
  constructor(
    readonly threadId: string,
    readonly userMessage: string,
    readonly userId: string,
    readonly orgId: string,
  ) {}
}

@QueryHandler(ChatWithAiStreamingQuery)
@Injectable()
export class ChatWithAiStreamingHandler implements IQueryHandler<ChatWithAiStreamingQuery> {
  constructor(@Inject(LLM_SERVICE) private readonly llmService: ILlmService) {}

  async *execute(query: ChatWithAiStreamingQuery): AsyncGenerator<string> {
    // Load thread history, portfolio context, etc.
    // Then stream response from LLM
    const systemPrompt = this.buildSystemPrompt();
    
    yield* this.llmService.chatStream({
      messages: [],
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt,
    });
  }

  private buildSystemPrompt(): string {
    return 'You are an expert contract analyst...';
  }
}
```

#### 2.3 SSE Controller Endpoint

**File**: `apps/backend/src/modules/chat/infrastructure/chat.controller.ts` (update)

```typescript
@Get('threads/:threadId/messages/stream')
async *streamMessage(
  @CurrentUser() user: RequestUser,
  @Param('threadId') threadId: string,
  @Query('message') message: string,
  @Res() res: Response,
): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await this.queryBus.execute(
    new ChatWithAiStreamingQuery(threadId, message, user.userId, user.userId),
  );

  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
  }

  res.end();
}
```

#### 2.4 Portfolio Context Expansion

**File**: `apps/backend/src/modules/chat/application/services/portfolio-context.service.ts` (update)

```typescript
@Injectable()
export class PortfolioContext {
  async loadForOrg(orgId: string): Promise<PortfolioContextData> {
    const [documents, referenceData] = await Promise.all([
      this.loadDocuments(orgId),
      this.loadReferenceData(orgId),
    ]);

    return {
      documents: this.truncateForTokenLimit(documents, 50000), // ~12.5K tokens
      stats: this.computeStats(documents),
      reference: referenceData,
    };
  }

  private async loadDocuments(orgId: string): Promise<DocumentWithClauses[]> {
    // Load all documents and their clauses, indexed by ID
    // Truncate clause text to first 500 chars to save tokens
  }

  private async loadReferenceData(orgId: string): Promise<unknown> {
    // Load standard clause types, risk levels, etc.
  }

  private truncateForTokenLimit(docs: unknown[], maxTokens: number): unknown {
    // Estimate token count and truncate lowest-priority documents
  }
}
```

#### 2.5 Error Handling & Recovery

**File**: `apps/backend/src/modules/chat/domain/exceptions/chat-errors.ts`

```typescript
import { ApplicationException } from '../../../../shared/exceptions/app-error';

export class ChatThreadNotFoundException extends ApplicationException {
  constructor(threadId: string) {
    super('CHAT_THREAD_NOT_FOUND', `Chat thread not found: ${threadId}`, 404);
  }
}

export class LlmServiceException extends ApplicationException {
  constructor(message: string, originalError?: Error) {
    super('LLM_SERVICE_ERROR', `LLM service error: ${message}`, 503);
  }
}

export class PortfolioContextLoadException extends ApplicationException {
  constructor(orgId: string, originalError?: Error) {
    super('PORTFOLIO_CONTEXT_ERROR', `Failed to load portfolio context for org ${orgId}`, 500);
  }
}

export class MessagePersistenceException extends ApplicationException {
  constructor(threadId: string, originalError?: Error) {
    super('MESSAGE_PERSISTENCE_ERROR', `Failed to persist message for thread ${threadId}`, 500);
  }
}
```

#### 2.6 Enhanced Testing

Backend:
- [ ] Integration test for SpecializedQueryHandlers.handleFinancialQuery
- [ ] Integration test for SpecializedQueryHandlers.handleRiskQuery
- [ ] Unit test for ChatWithAiStreamingHandler (verify stream chunks)
- [ ] Snapshot test for system prompt generation
- [ ] Integration test: verify citation accuracy
- [ ] Error handling tests: LLM timeout, invalid thread, permission denied

Frontend:
- [ ] Integration test: useChat hook with streaming (mocked service)
- [ ] Component test: ChatThread displays streaming messages
- [ ] Component test: Citations render with links to source documents
- [ ] Error state: display error message if LLM service fails
- [ ] Loading state: show spinner while waiting for response

### Phase 2 Success Criteria

- Specialized query handlers correctly route 4+ different query types
- Streaming responses work end-to-end (Server-Sent Events)
- Portfolio context loads without exceeding token limits
- Error handling covers: LLM timeouts, missing docs, auth failures
- Frontend displays streaming messages in real-time
- All new tests passing

---

## Phase 3: Polish, Optimization & Production Readiness (Weeks 3-4)

### Goals
- Optimize token usage and latency
- Implement citation linking and document preview
- Add analytics and monitoring
- Security hardening and rate limiting
- Performance tuning and caching

### Deliverables

#### 3.1 Citation Linking

**File**: `apps/backend/src/modules/chat/application/services/citation-resolver.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

export interface ResolvedCitation {
  type: 'clause' | 'document';
  id: string;
  title: string;
  url: string; // Frontend route to navigate to doc/clause
  relevance: number;
  excerpt?: string;
}

@Injectable()
export class CitationResolver {
  constructor(private readonly queryBus: QueryBus) {}

  async resolveCitations(citations: unknown[], orgId: string): Promise<ResolvedCitation[]> {
    // Load full details for each cited clause/document
    // Returns enriched citations with URLs and full text
  }
}
```

#### 3.2 Rate Limiting

**File**: `apps/backend/src/modules/chat/infrastructure/chat-rate-limiter.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatRateLimiter {
  // Per-user rate limit: 10 messages per minute
  private readonly maxMessagesPerMinute = 10;
  private readonly windowMs = 60_000;

  canProceed(userId: string): boolean {
    // Check Redis or in-memory store for user's message count
    // Return true if under limit
  }

  recordMessage(userId: string): void {
    // Increment counter in cache with TTL
  }
}
```

#### 3.3 Caching Strategy

**File**: `apps/backend/src/modules/chat/infrastructure/chat-cache.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatCacheService {
  // Cache portfolio context for 5 minutes per org
  // Cache thread messages for 10 minutes per thread
  // Cache LLM responses for identical questions (10 min TTL)

  async getOrLoadContext(orgId: string): Promise<unknown> {
    // Try cache first, then load
  }

  invalidateThreadCache(threadId: string): void {
    // Called after new message added
  }
}
```

#### 3.4 Monitoring & Observability

**File**: `apps/backend/src/modules/chat/infrastructure/chat-metrics.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatMetrics {
  recordMessageCreated(userId: string, executionTimeMs: number): void {
    // Log to structured logging system
    // Record: user, threadId, message type, latency, token counts
  }

  recordLlmCall(model: string, inputTokens: number, outputTokens: number, timeMs: number): void {
    // Track LLM usage for billing/optimization
  }

  recordError(errorCode: string, context: unknown): void {
    // Log errors for alerting
  }
}
```

#### 3.5 Frontend: Citation Display

**File**: `apps/frontend/src/components/chat/CitationBadge.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Citation } from '@/types/chat';

interface CitationBadgeProps {
  citation: Citation;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ citation }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (citation.type === 'clause') {
      navigate(`/documents/${citation.id}/clause-view`);
    } else {
      navigate(`/documents/${citation.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
      title={citation.excerpt}
    >
      <span className="font-semibold">[{citation.type}]</span>
      <span>{citation.title}</span>
      <span className="text-xs opacity-70">({Math.round(citation.relevance * 100)}%)</span>
    </button>
  );
};
```

#### 3.6 Performance Monitoring

**File**: `apps/frontend/src/hooks/useChatPerformance.ts`

```typescript
import { useEffect, useRef } from 'react';

export function useChatPerformance(messageId: string, executionTimeMs: number) {
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const timeToInteractive = Date.now() - startTimeRef.current;
    
    // Log to analytics
    console.log({
      event: 'chat_message_displayed',
      messageId,
      llmExecutionTimeMs: executionTimeMs,
      timeToInteractiveMs: timeToInteractive,
    });
  }, [messageId, executionTimeMs]);
}
```

#### 3.7 Security Hardening

- [ ] Rate limiting per user (10 msg/min)
- [ ] Validate thread ownership (user can only chat in their threads)
- [ ] Input sanitization on user messages (strip HTML, limit length to 5K chars)
- [ ] Audit logging: log all chat interactions
- [ ] CSRF protection on chat endpoints
- [ ] Sensitive data filtering: redact PII from LLM context

#### 3.8 Database Optimization

**File**: `apps/backend/prisma/schema.prisma` (indexes)

```prisma
// Add to ChatThread model:
@@index([userId, createdAt]) // For listThreads query

// Add to ChatMessage model:
@@index([status]) // For failed message recovery

// Add compound index for message fetching:
@@unique([threadId, sequence]) // Enforce ordering
```

#### 3.9 Production Checklist

- [ ] Environment variables documented (.env.example)
- [ ] Database migrations tested on staging
- [ ] Error monitoring setup (Sentry/DataDog)
- [ ] Logging structured and searchable
- [ ] Rate limiting enforced
- [ ] Input validation comprehensive
- [ ] CORS configured correctly
- [ ] SSL/TLS enforced
- [ ] Database backups configured
- [ ] Rollback plan documented

#### 3.10 Documentation

**File**: `apps/backend/src/modules/chat/README.md`

```markdown
# Chat Module

## Overview
Enables users to ask natural language questions about their contract portfolio.

## Architecture
- **Domain**: ChatThread aggregate, ChatMessage entity
- **Application**: CQRS queries for specialized request types
- **Infrastructure**: Prisma persistence, Claude LLM service

## Query Types
1. **Financial**: Payment terms, pricing, renewal
2. **Risk**: Liability, indemnification, warranties
3. **Timeline**: Dates, expirations, milestones
4. **Comparison**: Side-by-side contract analysis
5. **Clause Search**: Find specific clause types
6. **General**: Open-ended portfolio questions

## Integration Points
- **Documents Module**: Load document list, text content
- **Clauses Module**: Fetch extracted clauses, semantic search
- **Auth Module**: User identification, permission checks

## Database
- ChatThread: conversation session
- ChatMessage: individual messages (user or assistant)
- ChatFeedback: user feedback on responses

## API Endpoints
- POST /api/v1/chat/threads → start conversation
- GET /api/v1/chat/threads → list conversations
- GET /api/v1/chat/threads/:id → get thread
- POST /api/v1/chat/threads/:id/messages → send message
- GET /api/v1/chat/threads/:id/messages/stream → streaming response

## Testing
- Unit tests for domain models and services
- Integration tests for CQRS handlers
- E2E tests for HTTP endpoints
- Target: >80% code coverage

## Configuration
- LLM_SERVICE: 'claude' or 'mock'
- CHAT_RATE_LIMIT_PER_MIN: default 10
- CHAT_CONTEXT_TOKEN_LIMIT: default 50000
```

### Phase 3 Testing Checklist

Backend:
- [ ] Load test: 100 concurrent users, 5 msg/user/min
- [ ] LLM failure recovery test
- [ ] Rate limiting enforcement test
- [ ] Citation resolution accuracy test
- [ ] Database index performance test
- [ ] Cache invalidation test

Frontend:
- [ ] Citation links navigate to correct document
- [ ] Message ordering preserved after reload
- [ ] Streaming messages display in real-time
- [ ] Error messages clear and actionable
- [ ] Accessibility: screen reader reads citations
- [ ] Mobile responsive: chat works on iOS/Android

### Phase 3 Success Criteria

- All unit and integration tests passing
- Load test: <2s response time at 100 concurrent users
- Zero unhandled errors in production
- 95%+ uptime during beta
- User feedback: >4/5 satisfaction on response quality
- Performance: p95 latency <3 seconds
- Documentation complete and reviewed

---

## Cross-Phase Architectural Decisions

### 1. **Message Persistence vs. Streaming**

**Decision**: Persist all messages to database immediately, stream to client separately.

**Rationale**:
- Ensures durability and audit trail
- Allows conversation replay and history
- Decouples streaming UX from persistence
- Enables offline-first clients later

**Trade-off**: Slightly higher latency (write to DB before sending)

### 2. **LLM Context Strategy (Phase 12-13 decision point)**

**Phase 12**: Eager loading (load all portfolio context into system prompt)
**Phase 13**: RAG-based (semantic search for relevant clauses, then in-context)

**Current**: Load truncated portfolio snapshot (~50K tokens) to avoid exceeding LLM context window.

**Future upgrade**: Query vector DB for most relevant clauses, include only those.

### 3. **Citation Extraction**

**Phase 12**: Simple text pattern matching (`[Clause: ID]`)
**Phase 13**: Structured output via Claude's tools API

```json
{
  "citations": [
    { "type": "clause", "id": "...", "relevance": 0.92 }
  ]
}
```

### 4. **Specialization vs. Generalization**

**Decision**: Separate handler per query type (financial, risk, timeline) rather than single LLM-based router.

**Rationale**:
- Explicit, debuggable routing logic
- Can optimize each path independently
- Easier testing and monitoring per type

**Trade-off**: More code duplication; Phase 13 may consolidate.

### 5. **Authentication & Authorization**

**Scope**: User can only chat about their own portfolio (orgId == userId in Phase 1).

**Future**: Multi-tenant orgs; verify user has access to org before allowing chat.

---

## Integration Points with Existing Modules

### Documents Module
- **Dependency**: Load DocumentListItem for portfolio context
- **Interface**: `IDocumentListItemRepository.findByOrgId(orgId)`
- **Timing**: Called in ChatWithAiHandler before invoking LLM

### Clauses Module
- **Dependency**: Load Clause entities for citation resolution
- **Interface**: `GetClausesForDocumentQuery`, `GetSimilarClausesQuery`
- **Timing**: On-demand when resolving citations or building context

### Audit Module
- **Dependency**: Log chat interactions for compliance
- **Interface**: `RecordAuditEventCommand`
- **Timing**: After each message persisted (user message + AI response)

### Auth Module
- **Dependency**: Verify user identity in controller
- **Interface**: `@CurrentUser()` decorator, `RequestUser` DTO
- **Timing**: On every request (already in place)

---

## Risk Assessment & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **LLM Hallucination** | High | 1. Require citations for all claims<br/>2. Use lower temperature (0.7)<br/>3. Validate citations against DB<br/>4. User feedback loop |
| **Token Budget Exceeded** | Medium | 1. Implement token counting<br/>2. Truncate portfolio context<br/>3. Implement RAG (Phase 13) |
| **PII Exposure** | High | 1. Filter names from context<br/>2. Redact email addresses<br/>3. Audit LLM prompts regularly<br/>4. No full contract text in system prompt |
| **Rate Limit Bypass** | Medium | 1. Enforce per-user limit in cache<br/>2. Monitor for burst patterns<br/>3. IP-based rate limit as backup |
| **Database Lock Contention** | Low | 1. Use sequence numbers, not locks<br/>2. Async persistence where possible<br/>3. Shard by threadId if needed |
| **LLM Service Outage** | High | 1. Return cached responses<br/>2. Graceful degradation message<br/>3. Failover to mock service in staging<br/>4. SLA monitoring |

---

## File Dependency Graph

```
Chat Module
├── Infrastructure
│   ├── chat.controller.ts
│   │   └── queries (ChatWithAiQuery, etc.)
│   ├── chat.module.ts
│   │   └── providers (handlers, services, persistence)
│   ├── dtos/
│   │   ├── send-message.request.dto.ts
│   │   └── chat-message.response.dto.ts
│   └── persistence/
│       ├── prisma-chat-thread.repository.ts
│       │   └── Prisma ChatThread model
│       └── prisma-chat-message.repository.ts
│           └── Prisma ChatMessage model
├── Application
│   ├── commands/
│   │   ├── start-chat-thread.command.ts
│   │   └── start-chat-thread.handler.ts
│   ├── queries/
│   │   ├── chat-with-ai.query.ts
│   │   └── chat-with-ai.handler.ts
│   │       ├── ILlmService (port)
│   │       ├── QueryRouter (service)
│   │       ├── ResponseFormatter (service)
│   │       └── PortfolioContext (service)
│   └── services/
│       ├── query-router.service.ts
│       ├── response-formatter.service.ts
│       └── portfolio-context.service.ts
│           └── depends on Documents, Clauses modules
└── Domain
    ├── chat-thread/
    │   ├── chat-thread.aggregate.ts
    │   └── chat-thread-id.vo.ts
    ├── chat-message/
    │   ├── chat-message.entity.ts
    │   ├── message-id.vo.ts
    │   └── message-role.vo.ts
    └── ports/
        ├── llm-service.port.ts
        └── message-repository.ts
```

---

## Frontend Component Hierarchy

```
ChatPage
├── ChatThreadList
│   ├── useListChatThreads hook
│   └── ChatThreadItem (repeating)
│       └── onClick → navigate to ChatThread
├── ChatThread
│   ├── useGetChatThread hook
│   ├── MessageList
│   │   └── ChatMessage (repeating)
│   │       ├── CitationBadge (repeating)
│   │       └── onClick → navigate to document
│   └── ChatInput
│       ├── useSendChatMessage hook
│       └── onSend → update UI optimistically
```

---

## Testing Strategy Summary

### Unit Tests (80% of total)
- Value Objects (VO specs)
- Domain Aggregates (behavior specs)
- Application Services (query routing, response formatting)
- React Hooks (mocked services)

### Integration Tests (15%)
- CQRS handlers with real Prisma repos
- Chat workflow (thread → message → DB)
- Citations resolution

### E2E Tests (5%)
- HTTP endpoints (POST /chat/threads, etc.)
- Full user flow (create thread, send message, see response)
- Error scenarios

### Coverage Goals
- **Phase 1**: >80% unit, >70% integration
- **Phase 2**: >85% unit, >75% integration
- **Phase 3**: >90% unit, >80% integration, <5% E2E

---

## Rollout Plan

### Pre-Launch (Week 4)
- [ ] Internal testing by team (5 users)
- [ ] Security review (ChatThreadId validation, SQL injection tests)
- [ ] Performance testing (load test at 100 concurrent users)
- [ ] Documentation review

### Soft Launch (Week 5)
- [ ] Enable for 10% of users (feature flag)
- [ ] Monitor error rates, latency, feedback
- [ ] Gather usage metrics

### General Availability (Week 6)
- [ ] Enable for all users
- [ ] Monitor support tickets
- [ ] Iterate on UX based on feedback

---

## Future Enhancements (Phase 13+)

1. **RAG Integration**: Replace eager loading with semantic search
2. **Conversation Topics**: Auto-detect conversation theme (payments, risks, etc.)
3. **Multi-turn Reasoning**: Leverage extended thinking for complex analyses
4. **Custom Instructions**: Allow users to set portfolio-specific guardrails
5. **Batch Analysis**: "Analyze all auto-renewal clauses across my portfolio"
6. **Collaborative Chat**: Multiple users can chat in shared threads
7. **Chat History Export**: Download conversation as PDF
8. **Custom Models**: Allow enterprise customers to fine-tune LLM

---

## Appendix: Environment Configuration

**Backend (.env)**

```bash
# Chat Configuration
LLM_SERVICE=claude                  # 'claude' or 'mock'
CLAUDE_API_KEY=sk-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022

CHAT_CONTEXT_TOKEN_LIMIT=50000
CHAT_RATE_LIMIT_PER_MINUTE=10
CHAT_CACHE_TTL_MINUTES=5
```

**Frontend (.env)**

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_CHAT_STREAMING_ENABLED=true
```

---

## Quick Reference: File Checklist

### Backend Files to Create (Phase 1)
```
apps/backend/src/modules/chat/
├── domain/chat-thread/chat-thread.aggregate.ts ✓
├── domain/chat-thread/chat-thread-id.vo.ts ✓
├── domain/chat-thread/chat-thread.repository.ts ✓
├── domain/chat-message/message-id.vo.ts ✓
├── domain/chat-message/message-role.vo.ts ✓
├── domain/ports/llm-service.port.ts ✓
├── domain/ports/message-repository.ts ✓
├── application/commands/start-chat-thread.command.ts
├── application/commands/start-chat-thread.handler.ts
├── application/queries/chat-with-ai.query.ts ✓
├── application/queries/chat-with-ai.handler.ts ✓
├── application/services/query-router.service.ts ✓
├── application/services/response-formatter.service.ts ✓
├── application/services/portfolio-context.service.ts ✓
├── infrastructure/chat.controller.ts ✓
├── infrastructure/chat.module.ts ✓
├── infrastructure/dtos/ (5 DTOs)
├── infrastructure/persistence/ (2 repositories)
└── infrastructure/llm/ (claude + mock services)
```

### Frontend Files to Create (Phase 1)
```
apps/frontend/src/
├── hooks/useChat.ts ✓
├── services/chatService.ts ✓
├── components/chat/ChatThread.tsx
├── components/chat/ChatMessage.tsx
├── components/chat/ChatInput.tsx
├── types/chat.ts ✓
└── api/endpoints.ts (update existing)
```

### Database Files (Phase 1)
```
apps/backend/prisma/
├── schema.prisma (add ChatThread, ChatMessage, ChatFeedback models)
└── migrations/[timestamp]_add_chat_schema/
    └── migration.sql
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-06-21  
**Author**: Architecture Team  
**Status**: Ready for Implementation
