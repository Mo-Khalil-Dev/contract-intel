# Portfolio AI Chat Feature Design

## Overview

**Feature**: "Talk to Your Portfolio" - A conversational AI interface that allows users to ask questions about their entire contract portfolio and get instant, contextual insights.

**Goal**: Enable users to:
- Ask natural language questions about their contracts
- Get cross-document analysis and comparisons
- Identify risks, patterns, and opportunities across the portfolio
- Receive actionable recommendations

**Core Value**: Rather than manually reviewing documents, users can have a conversation with their portfolio data.

---

## Use Cases

### 1. Document-Specific Questions
- "What are the renewal dates for all my vendor contracts?"
- "Summarize the payment terms in my 2024 Service Agreement"
- "What are my obligations under the NDA with Acme Corp?"

### 2. Cross-Portfolio Analysis
- "Which of my contracts have the longest termination notice periods?"
- "Compare indemnification clauses across all my agreements"
- "Show me all contracts where I am not the party of control"

### 3. Risk & Compliance
- "Which contracts have the highest risk flags?"
- "List all clauses related to confidentiality across my portfolio"
- "What penalties could apply if we breach our SLA?"

### 4. Comparative & Strategic
- "What are the most common payment structures in my contracts?"
- "Which counterparties have the most restrictive non-compete clauses?"
- "Are there gaps in my contract coverage? What should I add?"

---

## Architecture

### Backend: New Chat Module

**Location**: `apps/backend/src/modules/chat/`

```
chat/
├── domain/
│   ├── chat-conversation.aggregate.ts
│   ├── chat-message.entity.ts
│   ├── chat-thread.value-object.ts
│   └── chat-service.domain-service.ts
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
│   ├── projections/
│   │   ├── chat-conversation-list.projection.ts
│   │   └── chat-thread.projection.ts
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
└── test/
    ├── in-memory-chat-conversation.repository.ts
    └── chat.service.spec.ts
```

### Key Services

#### 1. **PortfolioAnalyzerService**
- Analyzes user's document portfolio
- Prepares context for Claude API calls
- Handles multi-document semantic search
- Builds conversation context for RAG (Retrieval-Augmented Generation)

#### 2. **ChatService**
- Manages conversation lifecycle
- Calls Claude API with proper prompts
- Maintains conversation history
- Handles streaming responses (optional)

#### 3. **ChatRepository**
- Persists conversations and messages
- Handles conversation retrieval and listing

### Frontend: Chat UI Component

**Location**: `apps/frontend/src/components/features/portfolio-chat/`

```
portfolio-chat/
├── PortfolioChatPanel.tsx          # Sidebar chat panel
├── ChatMessage.tsx                 # Individual message component
├── ChatInput.tsx                   # Message input with submit
├── ChatWindow.tsx                  # Chat conversation view
├── hooks/
│   ├── usePortfolioChat.ts         # Chat API hooks
│   └── useChatHistory.ts           # History management
├── types.ts                        # TypeScript types
└── __tests__/
    ├── PortfolioChatPanel.test.tsx
    └── ChatInput.test.tsx
```

---

## Data Model

### Conversation Aggregate
```typescript
// Domain Entity
class ChatConversation {
  id: string;                      // UUID
  userId: string;                  // Owner
  organizationId: string;
  title: string;                   // Auto-generated from first message
  messages: ChatMessage[];         // Conversation history
  documentIds?: string[];          // Referenced documents (optional scope)
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

class ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: {
    documentId: string;
    clauseId?: string;
    excerpt: string;
  }[];
  createdAt: Date;
}
```

### Database Schema (Prisma)
```prisma
model ChatConversation {
  id              String    @id @default(cuid())
  userId          String    @db.VarChar(255)
  organizationId  String    @db.VarChar(255)
  title           String    @db.VarChar(255)
  documentIds     String[]  @default([])  // Optional scope filter
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastMessageAt   DateTime?
  messages        ChatMessage[]
  
  @@index([userId, organizationId])
  @@index([createdAt])
}

model ChatMessage {
  id              String    @id @default(cuid())
  conversationId  String
  conversation    ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role            String    @db.VarChar(50)
  content         String    @db.Text
  citations       Json?     // JSON array of citation objects
  createdAt       DateTime  @default(now())
  
  @@index([conversationId])
}
```

---

## API Contract

### Create Conversation
```
POST /api/v1/chat/conversations

Request:
{
  "title?": "string",           // Optional, auto-generated if not provided
  "documentIds?": ["id1", "id2"] // Limit chat scope to specific documents
}

Response:
{
  "id": "conv-123",
  "userId": "user-456",
  "title": "Portfolio Analysis",
  "documentIds": [],
  "createdAt": "2026-06-09T...",
  "updatedAt": "2026-06-09T...",
  "lastMessageAt": null,
  "messages": []
}
```

### Send Message (Chat)
```
POST /api/v1/chat/conversations/{conversationId}/messages

Request:
{
  "content": "What are my highest risk contracts?",
  "stream?": false  // Optional: true for Server-Sent Events
}

Response:
{
  "id": "msg-789",
  "conversationId": "conv-123",
  "role": "assistant",
  "content": "Based on your portfolio, I found 3 contracts with critical risk flags...",
  "citations": [
    {
      "documentId": "doc-1",
      "excerpt": "...relevant clause text..."
    }
  ],
  "createdAt": "2026-06-09T..."
}
```

### List Conversations
```
GET /api/v1/chat/conversations?limit=20&offset=0

Response:
{
  "data": [
    {
      "id": "conv-123",
      "title": "Portfolio Analysis",
      "documentIds": [],
      "lastMessageAt": "2026-06-09T...",
      "createdAt": "2026-06-09T...",
      "messageCount": 5
    }
  ],
  "total": 1,
  "hasMore": false
}
```

### Get Conversation (with full history)
```
GET /api/v1/chat/conversations/{conversationId}

Response:
{
  "id": "conv-123",
  "title": "Portfolio Analysis",
  "messages": [
    { "id": "msg-1", "role": "user", "content": "...", "createdAt": "..." },
    { "id": "msg-2", "role": "assistant", "content": "...", "createdAt": "..." }
  ],
  "createdAt": "2026-06-09T...",
  "updatedAt": "2026-06-09T..."
}
```

---

## Claude API Integration Strategy

### Prompt Engineering

#### System Prompt Template
```
You are an expert contract analyst helping users understand their portfolio of contracts.

Your role is to:
1. Answer specific questions about contracts or contract terms
2. Identify patterns, risks, and opportunities across their portfolio
3. Provide actionable insights and recommendations
4. Always cite which documents your answers reference

Important guidelines:
- Be precise and fact-based; never hallucinate contract terms
- If information is not in the provided context, say so explicitly
- Highlight high-risk clauses or unfavorable terms
- Suggest best-practice language when appropriate
- Keep responses concise but comprehensive

User's Portfolio Summary:
- Total Documents: {count}
- Document Types: {types}
- Date Range: {startDate} to {endDate}

Available document context is provided below in JSON format.
```

#### Context Preparation
```typescript
interface PortfolioContext {
  documentSummaries: {
    documentId: string;
    title: string;
    type: string;
    counterparty: string;
    executionDate: string;
    riskScore: number;
    keyClausesSummary: string;
  }[];
  
  extractedClauses: {
    documentId: string;
    clauseId: string;
    type: string;
    text: string;
    riskLevel: string;
  }[];
  
  userQuestionContext?: {
    recentDocumentIds: string[];
    relatedClausesIds: string[];
  };
}
```

### RAG Strategy (Retrieval-Augmented Generation)

1. **Query Understanding**: Analyze user question to identify:
   - Key entities (counterparty names, clause types)
   - Semantic intent (comparison, risk analysis, summary)
   - Scope (specific document vs. portfolio-wide)

2. **Context Retrieval**:
   - Use semantic search to find relevant clauses
   - Fetch related document metadata
   - Include recent conversation context for continuity

3. **Prompt Construction**:
   - Inject retrieved context into the prompt
   - Maintain conversation history for context
   - Add relevant document excerpts

4. **Response Generation**:
   - Claude analyzes context and generates response
   - Extract citations from context used
   - Return structured response with metadata

---

## UI/UX Design

### Option A: Sidebar Chat Panel (Recommended for MVP)
- Always-available chat in right sidebar
- Accessible from any page
- Quick access to portfolio insights
- Conversation history available in sidebar

### Option B: Dedicated Chat Page
- Full-screen experience at `/portfolio/chat`
- Richer conversation history view
- Better for deep analysis sessions

### Chat Message Design
```
[Assistant Message]
"Based on your portfolio, I found 3 contracts with 
critical risk flags..."

Citations:
📄 Service Agreement - Acme Corp (relevance: 95%)
   Clause: "Force Majeure" 
   
📄 NDA - Tech Startup Inc (relevance: 87%)
   Clause: "Confidentiality"

[Related Documents]
Show related documents mentioned in response
```

---

## Implementation Phases

### Phase 1: MVP (Minimal Viable Product)
**Timeline**: 2 weeks

**Deliverables**:
1. Basic chat interface (sidebar component)
2. API endpoints for:
   - Creating conversations
   - Sending messages
   - Listing conversations
3. Integration with Claude API (stateless, no memory)
4. Basic prompt that sends user question + portfolio summary
5. Message persistence
6. Simple UI with message display

**Tech**:
- NestJS CQRS for backend
- React hooks for frontend
- Prisma for persistence
- No streaming (sync responses)

---

### Phase 2: Context & Citations
**Timeline**: 1-2 weeks

**Deliverables**:
1. Semantic search integration to retrieve relevant clauses
2. Citation system (which documents were referenced)
3. Improved prompts with actual clause excerpts
4. RAG pipeline for context retrieval

**Tech**:
- Leverage existing semantic search infrastructure
- Embed documents/clauses in vector DB (if not already done)
- Citation tracking in responses

---

### Phase 3: Enhanced Features
**Timeline**: 2-3 weeks

**Deliverables**:
1. Streaming responses (Server-Sent Events)
2. Conversation titles (auto-generated or user-set)
3. Conversation history sidebar with search
4. Export conversation to PDF
5. Share conversation capability

**Tech**:
- SSE streaming
- Conversation bookmarking
- PDF generation

---

### Phase 4: Advanced Analysis
**Timeline**: Future

**Deliverables**:
1. Multi-document comparison mode
2. Custom report generation
3. Risk dashboard integration
4. Suggested questions based on portfolio
5. Contract amendment suggestions

---

## Security & Privacy Considerations

### Data Handling
- Conversations stored encrypted in database
- Claude API calls include only necessary context
- No PII beyond document references
- Users can only access their own conversations

### Access Control
- Conversations scoped to userId + organizationId
- API endpoints require authentication
- Row-level security in database

### API Key Management
- Claude API key stored in environment variables
- No exposure in client-side code
- Rate limiting per user
- Audit logging for API calls

---

## Success Metrics

### Adoption
- % of active users using chat feature
- Chat sessions per user per month
- Average conversation length

### Quality
- User satisfaction rating
- Citation accuracy (when implemented)
- False positive rate in risk identification

### Performance
- API response time (target: <2s)
- Message throughput
- Streaming latency (if implemented)

---

## Known Constraints & Future Improvements

### Constraints
- **Context Window**: Claude has token limits; large portfolios need smart context selection
- **Hallucination Risk**: May generate plausible-sounding but incorrect contract terms
- **Latency**: API calls to Claude introduce response delay
- **Cost**: Each chat message is an API call; usage scales with user engagement

### Mitigation Strategies
1. **Strict Grounding**: Prompt engineering to minimize hallucination
2. **Citation Requirements**: Always demand proof from documents
3. **Context Compression**: Summarize documents rather than passing full text
4. **Caching**: Cache common questions/responses where safe

### Future Improvements
1. **Fine-tuned Model**: Train custom Claude model on contract language
2. **Real-time Collaboration**: Multiple users in same chat
3. **Template Suggestions**: Auto-suggest contract language based on portfolio
4. **Anomaly Detection**: Flag unusual contract terms compared to user's norm
5. **Integration with Risk Engine**: Combine with existing risk scoring

---

## Testing Strategy

### Unit Tests
- ChatService (mocked Claude API)
- Message formatting and citation extraction
- Conversation state management

### Integration Tests
- Full flow: create conversation → send message → retrieve
- API endpoints with authentication
- Database persistence

### E2E Tests
- User flow: navigate to chat → ask question → read response
- Conversation history and persistence
- Citation verification

### Manual Testing
- Prompt engineering feedback loop
- Response quality review
- Edge cases (very long portfolios, unusual questions)

---

## References

- **Claude API Docs**: https://docs.anthropic.com
- **Existing Modules**: 
  - `apps/backend/src/modules/documents/` - Document management
  - `apps/backend/src/modules/clauses/` - Clause extraction (if exists)
  - `apps/frontend/src/components/features/semantic-search/` - Search UI patterns
