# Implementation Plan: Portfolio AI Chat Feature

**Feature**: "Talk to Your Portfolio" - Conversational AI interface for contract portfolio analysis  
**Branch**: `claude/portfolio-ai-chat-feature-FJtef`  
**Estimated Duration**: 8-12 weeks (3 phases)  
**Start Date**: Week of 2026-06-21  
**Team Size**: 2-3 engineers (1 backend, 1 frontend, 1 QA/integration)

---

## Executive Summary

This plan breaks down the portfolio AI chat feature into **3 deliverable phases** spanning 8-12 weeks:

- **Phase 1 (Weeks 1-2)**: MVP - Basic chat with stateless Claude integration
- **Phase 2 (Weeks 3-4)**: Query Intelligence - Query type handlers, intelligent context selection
- **Phase 3 (Weeks 5-6)**: Polish & Enhancement - Streaming, conversation history, advanced UX

Subsequent phases (7-12 weeks) handle streaming, advanced analytics, and premium features.

**Critical Path**: Phase 1 → Phase 2 → Phase 3 (sequential dependency on query handlers)

---

## Phase 1: MVP (Weeks 1-2) — Basic Chat Infrastructure

### Objectives
- ✅ Establish chat data model and database persistence
- ✅ Create basic API endpoints (CRUD conversations + messages)
- ✅ Integrate Claude API with simple prompting
- ✅ Build foundational React components
- ✅ Demonstrate end-to-end message flow

### Deliverables

#### Backend
- Domain models: `ChatConversation` aggregate, `ChatMessage` entity
- CQRS handlers: `CreateConversationCommand`, `SendMessageCommand`, `GetConversationQuery`, `ListConversationsQuery`
- Controller: `ChatController` with basic routes
- Repository: `PrismaChatRepository` with message persistence
- Service: `ChatService` for conversation lifecycle management
- Prisma schema updates + migration

#### Frontend
- Component: `ChatPanel` (sidebar or modal)
- Component: `ChatMessage` (display message with basic styling)
- Component: `ChatInput` (text input + send button)
- Hook: `usePortfolioChat` (React Query integration)
- Service: `chatService` (HTTP client for chat endpoints)

#### Database
```prisma
model ChatConversation {
  id              String    @id @default(cuid())
  userId          String    @db.VarChar(255)
  organizationId  String    @db.VarChar(255)
  title           String    @db.VarChar(255)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastMessageAt   DateTime?
  messages        ChatMessage[]
  
  @@index([userId, organizationId, createdAt])
}

model ChatMessage {
  id              String    @id @default(cuid())
  conversationId  String
  conversation    ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role            String    @db.VarChar(50)
  content         String    @db.Text
  createdAt       DateTime  @default(now())
  
  @@index([conversationId])
}
```

### File Structure

```
apps/backend/src/modules/chat/
├── domain/
│   ├── chat-conversation.aggregate.ts
│   └── chat-message.entity.ts
├── application/
│   ├── commands/
│   │   ├── create-conversation.command.ts
│   │   ├── create-conversation.handler.ts
│   │   ├── send-message.command.ts
│   │   └── send-message.handler.ts
│   ├── queries/
│   │   ├── get-conversation.query.ts
│   │   ├── get-conversation.handler.ts
│   │   ├── list-conversations.query.ts
│   │   └── list-conversations.handler.ts
│   └── dtos/
│       ├── create-conversation.dto.ts
│       ├── send-message.dto.ts
│       └── chat-message.response.dto.ts
├── infrastructure/
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   ├── prisma-chat-conversation.repository.ts
│   ├── claude-portfolio-analyzer.service.ts
│   └── chat.module.ts
└── __tests__/
    ├── chat.service.spec.ts
    ├── send-message.handler.spec.ts
    └── chat.controller.spec.ts

apps/frontend/src/components/features/portfolio-chat/
├── ChatPanel.tsx
├── ChatWindow.tsx
├── ChatMessage.tsx
├── ChatInput.tsx
├── types.ts
└── __tests__/
    ├── ChatPanel.test.tsx
    └── ChatInput.test.tsx

apps/frontend/src/hooks/
├── usePortfolioChat.ts
└── __tests__/
    └── usePortfolioChat.test.tsx

apps/frontend/src/services/
└── chatService.ts
```

### API Endpoints (Phase 1)

```
POST   /api/v1/chat/conversations
       Create new conversation
       Response: { id, userId, organizationId, title, createdAt, messages: [] }

POST   /api/v1/chat/conversations/:conversationId/messages
       Send message (stateless - no context builder yet)
       Body: { content: string }
       Response: { id, conversationId, role, content, createdAt }

GET    /api/v1/chat/conversations
       List conversations
       Query: ?limit=20&offset=0
       Response: { data: [...], total, hasMore }

GET    /api/v1/chat/conversations/:conversationId
       Retrieve full conversation with messages
       Response: { id, title, messages: [...], createdAt, updatedAt }
```

### Claude Integration (Phase 1 - Simple)

**System Prompt** (Generic):
```
You are an expert contract analyst helping users understand their portfolio.

Answer questions about contracts accurately and thoroughly.
Cite specific contract names and clauses when relevant.
If information is not available, say so explicitly.
Keep responses concise but comprehensive.
```

**User Message**:
```
User's portfolio summary:
- Total Documents: {count}
- Date Range: {dates}

User Question: {question}

Please answer based on your knowledge of contract analysis.
```

**Response Handling**:
- Simple text extraction from Claude response
- Save to database as-is (no citations yet)
- Return to frontend

### Testing Strategy (Phase 1)

**Unit Tests** (required 80%+ coverage):
- Domain models: aggregate creation, entity validation
- DTOs: validation with class-validator
- Handler: mock repository, verify command execution
- Service: mock Claude API, verify message saving

**Integration Tests**:
- Controller → Handler → Repository flow
- Database: create conversation, add messages, retrieve
- CQRS: command execution → state persistence

**E2E Tests** (manual):
- User creates conversation
- User sends message
- Message appears in UI
- Retrieve conversation history

**Mock Implementation**:
```typescript
// For Phase 1, mock Claude responses
const MOCK_RESPONSES: Record<string, string> = {
  'what': 'Based on your portfolio...',
  'default': 'I can help you analyze your contracts.',
};
```

### Implementation Checklist

**Week 1:**
- [ ] Prisma schema + migration (1 day)
- [ ] Domain models (1 day)
- [ ] CQRS handlers (2 days)
- [ ] Controller + Repository (1 day)
- [ ] Unit tests (1 day)

**Week 2:**
- [ ] Claude integration service (1 day)
- [ ] Frontend components (ChatPanel, ChatMessage, ChatInput) (2 days)
- [ ] React hooks + services (1 day)
- [ ] Integration tests (1 day)
- [ ] Bug fixes + refinement (1 day)

### Success Criteria (Phase 1)
- [ ] User can create conversation
- [ ] User can send message
- [ ] Claude responds with generic answer
- [ ] Messages persist in database
- [ ] Can retrieve conversation history
- [ ] All tests passing (>80% coverage)
- [ ] No TypeScript errors

### Known Limitations (Phase 1)
- ❌ No context awareness (sends only question to Claude)
- ❌ No citation tracking
- ❌ No streaming responses
- ❌ No suggested questions
- ❌ No conversation history sidebar
- ❌ All conversations sent same prompt to Claude

---

## Phase 2: Query Intelligence (Weeks 3-4) — Query Handlers & Context

### Objectives
- ✅ Implement query classification system
- ✅ Build query-specific handlers for each question type
- ✅ Intelligent context selection from database
- ✅ Query-specific prompting strategies
- ✅ Citation extraction and tracking
- ✅ Response formatting based on question type

### Deliverables

#### Backend
- `QueryClassifierService` - Categorize questions
- Query Handlers (6 types):
  - `RiskAnalysisHandler`
  - `ComparisonHandler`
  - `DocumentSpecificHandler`
  - `TimelineHandler`
  - `ClauseTypeSearchHandler`
  - `FinancialHandler`
- `QueryHandlerRegistry` - Route to appropriate handler
- `ContextBuilderService` - Extract relevant context per type
- `PromptBuilderService` - Build query-specific prompts
- `CitationExtractorService` - Extract citations from Claude response
- `ResponseFormatterService` - Format responses per type
- Update `SendMessageHandler` to use new architecture
- Unit tests for all services

#### Frontend
- `SuggestedQuestions` component (shows 4-6 initial suggestions)
- Update `ChatMessage` to handle different response formats
- Add metadata display (matched documents, structured data)
- Update `ChatInput` for better UX

#### Database
```prisma
// Extend ChatMessage with metadata
model ChatMessage {
  // ... existing fields
  citations           Json?           // Array of citation objects
  metadata            Json?           // Response format, structured data
  responseType        String?         // risk_analysis, comparison, etc.
}
```

### File Structure

```
apps/backend/src/modules/chat/infrastructure/
├── query-classifier.service.ts
├── query-handler-registry.ts
├── context-builder.service.ts
├── prompt-builder.service.ts
├── citation-extractor.service.ts
├── response-formatter.service.ts
└── query-handlers/
    ├── query.handler.interface.ts
    ├── risk-analysis.handler.ts
    ├── comparison.handler.ts
    ├── document-specific.handler.ts
    ├── timeline.handler.ts
    ├── clause-type-search.handler.ts
    ├── financial.handler.ts
    └── __tests__/
        ├── risk-analysis.handler.spec.ts
        ├── comparison.handler.spec.ts
        └── ... (one test per handler)

apps/frontend/src/components/features/portfolio-chat/
├── SuggestedQuestions.tsx
├── CitationBadge.tsx
└── ResponseFormatters/
    ├── RiskAnalysisResponse.tsx
    ├── ComparisonResponse.tsx
    ├── TimelineResponse.tsx
    └── ... (per response type)
```

### Query Handler Interface

```typescript
export interface QueryHandler {
  canHandle(queryType: QueryType): boolean;
  
  buildContext(
    userId: string,
    orgId: string,
    question: string,
  ): Promise<PortfolioContext>;
  
  buildPrompt(context: PortfolioContext): {
    system: string;
    user: string;
  };
  
  extractCitations(
    response: string,
    context: PortfolioContext,
  ): Citation[];
  
  formatResponse(
    response: string,
    citations: Citation[],
  ): FormattedResponse;
}

interface FormattedResponse {
  content: string;
  citations: Citation[];
  metadata?: {
    responseType: QueryType;
    format: 'prose' | 'list' | 'comparison' | 'timeline';
    structuredData?: Record<string, any>;
  };
}
```

### Context Preparation Per Type

| Query Type | Context Sources | Key Data |
|---|---|---|
| Risk Analysis | Documents (risk scores) + Critical Clauses | Ranked docs + high-risk clauses |
| Comparison | Clauses (same type) + Metadata | Payment/liability terms side-by-side |
| Document Specific | Single document + all clauses | Full contract summary |
| Timeline | Documents (dates) + Notice periods | Expiration dates + action items |
| Clause Type | Clauses (filtered by type) + Docs | All instances of clause type |
| Financial | Documents (payment fields) | Payment amounts + schedules |

### Testing Strategy (Phase 2)

**Unit Tests** (90%+ coverage):
- Classifier: each query type pattern
- Each handler: context build, prompt generation, citations, formatting
- Registry: handler routing

**Integration Tests**:
- Full flow: classify → handler → context → Claude → format
- Database queries for each handler type
- Real Prisma queries (test database)

**E2E Tests**:
- Risk question → get ranked list with citations
- Comparison question → get side-by-side comparison
- Timeline question → get sorted expiry list
- Financial question → get breakdown with totals

### Claude Integration (Phase 2)

Each handler provides tailored system prompt:

**Risk Handler System Prompt**:
```
You are a senior risk analyst specializing in contract risk assessment.

Your role:
- Identify high-risk contracts
- Explain WHY each contract is risky
- Rank by severity
- Suggest mitigation steps

Guidelines:
- Be direct about critical issues
- Quantify risk where possible
- Focus on critical risk level clauses
- Suggest immediate action items
```

**Comparison Handler System Prompt**:
```
You are a contract comparison specialist.

Your role:
- Compare specific terms across contracts
- Highlight material differences
- Identify best/worst terms
- Explain implications

Guidelines:
- Use side-by-side format
- Be concise but thorough
- Call out outliers
- Recommend favorable terms
```

(Similar for each handler type)

### Implementation Checklist

**Week 3:**
- [ ] QueryClassifierService (1 day)
- [ ] ContextBuilderService (2 days)
- [ ] PromptBuilderService (1 day)
- [ ] Unit tests for above (1 day)

**Week 4:**
- [ ] Implement 6 query handlers (3 days)
- [ ] CitationExtractorService (1 day)
- [ ] ResponseFormatterService (1 day)
- [ ] Unit + integration tests (2 days)
- [ ] Update SendMessageHandler (1 day)
- [ ] Frontend: SuggestedQuestions, CitationBadge (1 day)
- [ ] End-to-end testing (1 day)

### Success Criteria (Phase 2)
- [ ] Classifier correctly identifies all 6 query types
- [ ] Each handler builds appropriate context
- [ ] Each handler generates tailored prompt
- [ ] Citations extracted and linked correctly
- [ ] Response format metadata set properly
- [ ] 90%+ test coverage
- [ ] Risk question returns ranked list
- [ ] Comparison question returns structured comparison
- [ ] Timeline question returns sorted by urgency
- [ ] Financial question returns with totals

### Breaking Changes (Phase 2)
- `SendMessageCommand` now returns formatted response with metadata
- `ChatMessage.metadata` added to schema (migration required)
- Citation extraction may miss some references (acceptable MVP)

---

## Phase 3: Polish & UX (Weeks 5-6) — Streaming, History, Refinement

### Objectives
- ✅ Implement streaming responses (Server-Sent Events)
- ✅ Build conversation history sidebar
- ✅ Auto-generate conversation titles
- ✅ Suggested questions from semantic search
- ✅ Better loading/error states
- ✅ Conversation search/filtering

### Deliverables

#### Backend
- Streaming endpoint: `POST /api/v1/chat/conversations/:id/messages?stream=true`
- Conversation title generation (Claude or keyword-based)
- Service: `ConversationTitleService`
- Update `SendMessageHandler` to support streaming
- Unit tests for streaming flow

#### Frontend
- `ConversationHistory` sidebar (list of past conversations)
- `StreamingChatMessage` (stream response word-by-word)
- `ChatLoadingIndicator` (better UX during streaming)
- Filter/search conversations
- Delete conversation option
- Update `ChatPanel` to show history

#### Database
```prisma
// Add to ChatConversation
model ChatConversation {
  // ... existing fields
  isBookmarked      Boolean   @default(false)
  tags              String[]  @default([])
}
```

### API Endpoints (Phase 3)

```
POST   /api/v1/chat/conversations/:conversationId/messages?stream=true
       Send message with streaming response
       Returns: Server-Sent Events stream
       Format: event: message\ndata: {...chunk...}\n\n

DELETE /api/v1/chat/conversations/:conversationId
       Delete conversation

PATCH  /api/v1/chat/conversations/:conversationId
       Update conversation (title, bookmark)
       Body: { title?, isBookmarked? }
```

### Testing Strategy (Phase 3)

**Unit Tests**:
- Title generation service
- Streaming encoder/decoder

**Integration Tests**:
- SSE stream handling
- Message chunks reconstruct correctly

**E2E Tests**:
- Send message with stream=true
- Watch response stream in real-time
- History sidebar shows conversations
- Can search past conversations

### Implementation Checklist

**Week 5:**
- [ ] Streaming endpoint (2 days)
- [ ] TitleGenerationService (1 day)
- [ ] Frontend StreamingMessage component (1 day)
- [ ] History sidebar UI (1 day)
- [ ] Integration tests (1 day)

**Week 6:**
- [ ] Delete conversation (1 day)
- [ ] Search/filter history (1 day)
- [ ] Better error states (1 day)
- [ ] Performance optimization (1 day)
- [ ] E2E testing + bug fixes (2 days)

### Success Criteria (Phase 3)
- [ ] Streaming responses work end-to-end
- [ ] Conversation history sidebar functional
- [ ] Auto-generated titles are descriptive
- [ ] Can delete conversations
- [ ] Search/filter conversations work
- [ ] No regressions in Phase 1-2 functionality
- [ ] Loading states improved
- [ ] All tests passing

---

## Phase 4: Advanced Features (Weeks 7-12) — Optional/Future

### Objectives
- Conversation sharing
- Export to PDF
- Multi-document comparison mode
- Suggested follow-up questions
- Conversation templates
- Analytics on chat usage

### Not in Initial Scope
- Voice input/output
- Persistent conversation search
- User preferences for chat behavior
- Integration with other portfolio features (yet)

---

## Database Changes Summary

### New Tables
- `ChatConversation` (conversations table)
- `ChatMessage` (messages table)

### Schema Migrations
```
-- Phase 1
CREATE TABLE chat_conversation (...)
CREATE TABLE chat_message (...)
CREATE INDEX idx_chat_conversation_user_org ON chat_conversation(userId, organizationId)
CREATE INDEX idx_chat_message_conversation ON chat_message(conversationId)

-- Phase 2
ALTER TABLE chat_message ADD COLUMN citations JSON
ALTER TABLE chat_message ADD COLUMN metadata JSON
ALTER TABLE chat_message ADD COLUMN response_type VARCHAR(50)

-- Phase 3
ALTER TABLE chat_conversation ADD COLUMN is_bookmarked BOOLEAN DEFAULT false
ALTER TABLE chat_conversation ADD COLUMN tags TEXT[] DEFAULT '{}'
```

### Prisma Migration Commands
```bash
npm run prisma:migrate -- --name add_chat_tables  # Phase 1
npm run prisma:migrate -- --name extend_chat_messages  # Phase 2
npm run prisma:migrate -- --name add_conversation_metadata  # Phase 3
```

---

## Critical Dependencies & Risks

### Dependencies
- **Database**: Needs Prisma migration infrastructure (exists ✅)
- **Auth**: Requires user/org context in requests (exists ✅)
- **Documents Module**: Must be able to fetch user docs by org (exists ✅)
- **Clauses Module**: Must be able to query extracted clauses (exists ✅)
- **Claude API**: Requires valid API key in env (exists ✅)

### Architectural Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Query Handler Registry Pattern | Type-safe, extensible, testable | More files, complexity |
| Response formatting in backend | Type hints on frontend, flexible | Complex serialization |
| Streaming via SSE | No polling, real-time feel | Browser compatibility (IE 11) |
| CQRS for chat commands | Consistency with project pattern | Not strictly necessary for simple chat |
| Stateless (no memory between messages yet) | Simpler Phase 1, can add later | Context limited to current question |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Claude API rate limits | Medium | User experience | Implement rate limiting, queuing |
| Large portfolio context → token overflow | Medium | Accuracy | Limit context size, summarize |
| Query classifier misclassifies | Medium | Poor responses | Feedback loop, improve patterns |
| Citation extraction misses references | High | User confusion | Manual review, accept ~80% accuracy |
| Streaming connections drop | Low | Incomplete responses | Retry logic, fallback to sync |
| Database migration fails in production | Low | Deployment blocked | Test migrations on prod-like DB |

### Mitigation Strategies

1. **Token Limits**: Cap context to 4K tokens; prioritize recent clauses
2. **Rate Limiting**: 5 requests/minute per user, queue excess
3. **Classifier Feedback**: Add "was this helpful?" → log misclassifications
4. **Citation Fallback**: If extraction fails, return full response without citations
5. **Streaming Safety**: 30-second timeout, automatic fallback to sync
6. **DB Testing**: Always test migrations on staging first

---

## Integration Points

### With Documents Module
- Query: `DocumentRepository.findByUserAndOrg()`
- Query: `DocumentRepository.findById()`
- Metadata: document type, counterparty, dates, risk scores

### With Clauses Module
- Query: `ClauseRepository.findByDocument()`
- Query: `ClauseRepository.findByType()`
- Query: `ClauseRepository.findBySimilarity()` (if exists)
- Data: clause text, type, risk level, section number

### With Auth Module
- Decorator: `@CurrentUser()` for user context
- Guard: `SessionAuthGuard` for protected routes
- Scope: All queries filtered by `organizationId`

### With Audit Module
- Log all Claude API calls (for compliance)
- Log message creation/deletion
- Sensitive data masking if needed

---

## Testing Strategy (Overall)

### Test Coverage Goals
- **Phase 1**: 80%+ coverage (focus: handlers, repository, controller)
- **Phase 2**: 90%+ coverage (focus: all handlers, services)
- **Phase 3**: 90%+ coverage (focus: streaming, edge cases)

### Test Structure
```
Unit Tests (70%):
- Domain models
- Services (Classifier, ContextBuilder, etc.)
- DTOs and validators
- Individual handlers

Integration Tests (20%):
- Full CQRS flow
- Database persistence
- Multiple handlers working together
- API endpoint contracts

E2E Tests (10%):
- Real browser → backend → Claude
- Conversation creation → message send → response
- History retrieval
- Streaming responses
```

### Test Data
- Use existing contract/clause test data
- Create 2-3 synthetic conversations for testing
- Mock Claude responses (deterministic)
- Test database (separate from dev)

---

## Deployment Strategy

### Phase 1 Deployment
- Feature flag: `CHAT_FEATURE_ENABLED=true`
- Backend: Deploy new chat module
- Frontend: Deploy chat components
- Database: Run migrations
- Rollback: Disable flag if issues

### Phase 2 Deployment
- No database changes (only schema extensions)
- New handlers deployed alongside existing code
- A/B test: Show suggested questions to 50% of users
- Rollback: Disable new handlers if quality issues

### Phase 3 Deployment
- Streaming endpoint side-by-side with sync endpoint
- History sidebar opt-in for beta users
- Staged rollout over 1 week

### Monitoring & Metrics
- Track: Message count, avg response time, error rate
- Alert: API latency > 3s, Claude API errors > 1%
- Logging: All questions + classifications for analysis

---

## Success Metrics (End of Phase 3)

### User Engagement
- % of active users using chat (target: 25%+)
- Average messages per user per session (target: 3+)
- Conversation completion rate (target: 70%+)

### Quality
- User satisfaction rating (target: 4+/5)
- Citation accuracy (target: 90%+)
- Classifier accuracy (target: 95%+)

### Performance
- P95 response time < 2s (without streaming)
- Streaming time to first token < 0.5s
- Error rate < 1%

### Operational
- No data loss incidents
- <99.5% uptime (excluding maintenance)
- Claude API cost per message < $0.05

---

## Team Assignments (Recommended)

### Backend Engineer (Full 12 weeks)
- Phase 1: Scaffolding, CQRS, Claude integration (Weeks 1-2)
- Phase 2: Query handlers, context builders (Weeks 3-4)
- Phase 3: Streaming, title generation (Weeks 5-6)
- Support Phase 4+ features

### Frontend Engineer (Full 12 weeks)
- Phase 1: Components, hooks, styling (Weeks 1-2)
- Phase 2: Response formatters, suggested questions (Weeks 3-4)
- Phase 3: History sidebar, streaming UI (Weeks 5-6)
- Support Phase 4+ features

### QA/Integration (Part-time, 6 weeks)
- Phase 1: Manual testing, integration tests (Weeks 1-2)
- Phase 2: E2E tests, query type validation (Weeks 3-4)
- Phase 3: Streaming tests, edge cases (Weeks 5-6)

---

## Glossary

| Term | Definition |
|------|-----------|
| Query Type | Category of question (risk, comparison, etc.) |
| Handler | Service that knows how to process one query type |
| Context | Relevant data from database sent to Claude |
| Citation | Reference to a source document/clause |
| Response Format | How answer is structured (prose, list, comparison, etc.) |
| Streaming | Real-time delivery of response chunks via SSE |
| Conversation | Thread of user → assistant messages |

---

## References

- **Design Document**: `/home/user/contract-intel/DESIGN_PORTFOLIO_AI_CHAT.md`
- **Flow Document**: `/home/user/contract-intel/FLOW_QUESTION_TO_ANSWER.md`
- **Existing Modules**: `apps/backend/src/modules/{documents,clauses,auth}`
- **Prisma Setup**: `apps/backend/prisma/schema.prisma`
- **React Patterns**: `apps/frontend/src/hooks/useDocumentList.ts` (React Query example)
- **CQRS Pattern**: `apps/backend/src/modules/audit/` (existing CQRS implementation)

---

## Appendix: Implementation Checklist Template

Use this to track progress during development:

```markdown
## Phase 1 Progress

### Backend
- [ ] Prisma schema
- [ ] Migration created
- [ ] ChatConversation aggregate
- [ ] ChatMessage entity
- [ ] CreateConversationCommand + Handler
- [ ] SendMessageCommand + Handler
- [ ] GetConversationQuery + Handler
- [ ] ListConversationsQuery + Handler
- [ ] ChatController
- [ ] PrismaChatRepository
- [ ] ChatService
- [ ] ClaudePortfolioAnalyzerService
- [ ] ChatModule wiring
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] API documentation

### Frontend
- [ ] ChatPanel component
- [ ] ChatWindow component
- [ ] ChatMessage component
- [ ] ChatInput component
- [ ] usePortfolioChat hook
- [ ] chatService
- [ ] Types file
- [ ] Component tests
- [ ] Integration with app layout
- [ ] Responsive design

### Testing
- [ ] Unit tests backend (80%+)
- [ ] Unit tests frontend
- [ ] Integration tests
- [ ] Manual E2E flow
- [ ] Error scenarios
- [ ] Authentication/authorization

### Documentation
- [ ] API endpoint specs
- [ ] Component props/types
- [ ] Setup instructions
- [ ] Troubleshooting guide

### Review & QA
- [ ] Code review
- [ ] Security review (auth, input validation)
- [ ] Performance review
- [ ] Browser compatibility testing
- [ ] Accessibility review
```

---

## Change Log

- **2026-06-21**: Initial implementation plan created
- **Phase Estimates**: Based on 2 FTE engineers, 40 hours/week
- **Risk Level**: Medium (straightforward architecture, well-established patterns)
