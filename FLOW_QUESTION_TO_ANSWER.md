# Portfolio AI Chat - Question to Answer Flow

## Overview

This document traces the complete flow of a user's question through the system, from React component submission until the final answer is displayed.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  Components → Hooks (React Query) → Services (HTTP Client)       │
└─────────────────────────────────────────────────────────────────┘
                            ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (NestJS)                           │
│ Controller → CQRS Handler → Domain Logic → Repository            │
│ (Authentication → Command/Query Bus → Business Logic)            │
└─────────────────────────────────────────────────────────────────┘
                            ↓ API Call
┌─────────────────────────────────────────────────────────────────┐
│                  External AI Service (Claude API)                │
│  Anthropic Claude • RAG Context • Streaming or Sync              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Step-by-Step Flow

### **Stage 1: User Input (React Frontend)**

#### 1a. User Types Question
```
ChatInput Component
├─ User types: "What are my highest risk contracts?"
├─ State: message input value updated
└─ User clicks Send or presses Ctrl+Enter
```

#### 1b. Component Structure
```typescript
// apps/frontend/src/components/features/portfolio-chat/ChatInput.tsx
<ChatInput>
  ├─ <input> value={messageText} onChange={setMessageText}
  ├─ <button onClick={handleSend}>Send</button>
  └─ Loading state during API call
```

#### 1c. Send Handler Triggers Hook
```typescript
// apps/frontend/src/components/features/portfolio-chat/ChatWindow.tsx
const { sendMessage, isLoading } = usePortfolioChat(conversationId);

const handleSend = async (message: string) => {
  await sendMessage(message);  // ← Calls hook
};
```

---

### **Stage 2: Frontend API Layer**

#### 2a. React Query Hook
```typescript
// apps/frontend/src/hooks/usePortfolioChat.ts
export const usePortfolioChat = (conversationId: string) => {
  const mutation = useMutation({
    mutationFn: (message: string) => 
      chatService.sendMessage(conversationId, message),
    onSuccess: (response) => {
      queryClient.setQueryData(
        ['chat-conversation', conversationId],
        (old) => ({
          ...old,
          messages: [...old.messages, response],
        })
      );
    },
  });

  return {
    sendMessage: mutation.mutate,
    isLoading: mutation.isPending,
  };
};
```

#### 2b. HTTP Service Layer
```typescript
// apps/frontend/src/services/chatService.ts
export const chatService = {
  sendMessage(
    conversationId: string,
    content: string
  ): Promise<ChatMessageResponse> {
    return httpService
      .post<ChatMessageResponse>(
        API.CHAT.SEND_MESSAGE(conversationId),
        { content }
      )
      .then(unwrap);
  },
};
```

#### 2c. API Endpoint Definition
```typescript
// apps/frontend/src/api/endpoints.ts
export const API = {
  CHAT: {
    SEND_MESSAGE: (id: string) => `/api/v1/chat/conversations/${id}/messages`,
  },
};
```

#### 2d. HTTP Request Sent
```
POST /api/v1/chat/conversations/conv-123/messages
Host: localhost:3000
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "What are my highest risk contracts?"
}
```

---

### **Stage 3: Backend Controller Layer**

#### 3a. NestJS Controller Route
```typescript
// apps/backend/src/modules/chat/infrastructure/chat.controller.ts
import { Controller, Post, Body, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser, RequestUser } from '@/auth/decorators/current-user.decorator';

@Controller('chat/conversations')
export class ChatController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: Logger,
  ) {}

  @Post(':conversationId/messages')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ChatMessageResponseDto> {
    this.logger.log(
      `User ${user.id} sending message to conversation ${conversationId}`
    );

    return this.commandBus.execute(
      new SendMessageCommand(
        conversationId,
        user.id,
        user.organizationId,
        dto.content,
      )
    );
  }
}
```

**Request Details**:
- `conversationId`: Extracted from URL path parameter
- `dto.content`: "What are my highest risk contracts?"
- `user`: Retrieved from JWT token via decorator
- `user.organizationId`: Tenant isolation

---

### **Stage 4: CQRS Command Handler**

#### 4a. Command Definition
```typescript
// apps/backend/src/modules/chat/application/commands/send-message.command.ts
export class SendMessageCommand {
  constructor(
    public readonly conversationId: string,
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly content: string,
  ) {}
}
```

#### 4b. Command Handler
```typescript
// apps/backend/src/modules/chat/application/commands/send-message.handler.ts
@CommandHandler(SendMessageCommand)
export class SendMessageHandler
  implements ICommandHandler<SendMessageCommand>
{
  constructor(
    private readonly chatRepository: ChatConversationRepository,
    private readonly portfolioAnalyzer: PortfolioAnalyzerService,
    private readonly claudeService: ClaudePortfolioAnalyzerService,
    private readonly logger: Logger,
  ) {}

  async execute(
    command: SendMessageCommand,
  ): Promise<ChatMessageResponseDto> {
    const { conversationId, userId, organizationId, content } = command;

    // Step 4b-i: Validate conversation exists and user has access
    const conversation = await this.chatRepository.findById(conversationId);
    
    if (!conversation) {
      throw new ConversationNotFoundException(conversationId);
    }
    
    if (conversation.userId !== userId) {
      throw new UnauthorizedException(
        'You do not have access to this conversation'
      );
    }

    // Step 4b-ii: Create user message entity
    const userMessage = ChatMessage.create({
      conversationId,
      role: 'user',
      content,
    });

    // Step 4b-iii: Save user message to database
    await this.chatRepository.addMessage(conversationId, userMessage);

    this.logger.log(`Saved user message to conversation ${conversationId}`);

    // PROCEED TO STAGE 5
    return this.generateAssistantResponse(
      conversationId,
      userId,
      organizationId,
      content,
    );
  }

  private async generateAssistantResponse(
    conversationId: string,
    userId: string,
    organizationId: string,
    userQuestion: string,
  ): Promise<ChatMessageResponseDto> {
    // Proceed to Stage 5...
  }
}
```

**Key Validations**:
- Conversation exists
- User owns conversation (authorization)
- Message content is not empty

---

### **Stage 5: Portfolio Context Preparation**

#### 5a. Retrieve User's Documents
```typescript
// In ChatService or dedicated ContextBuilder
private async preparePortfolioContext(
  userId: string,
  organizationId: string,
  conversationId: string,
  userQuestion: string,
): Promise<PortfolioContext> {
  // Step 5a-i: Get all documents for user
  const documents = await this.documentRepository.findByUserAndOrg(
    userId,
    organizationId,
  );

  if (documents.length === 0) {
    throw new NoDocumentsException(
      'User has no documents. Add contracts first.'
    );
  }

  this.logger.log(
    `Retrieved ${documents.length} documents for user ${userId}`
  );

  // Step 5a-ii: Get document metadata (type, counterparty, dates)
  const documentMetadata = documents.map((doc) => ({
    documentId: doc.id,
    title: doc.name,
    type: doc.documentType,
    counterparty: doc.counterparty,
    executionDate: doc.executionDate,
    riskScore: doc.riskScore,
  }));

  return {
    documentCount: documents.length,
    documentMetadata,
    // Continue to step 5b...
  };
}
```

#### 5b. Retrieve Extracted Clauses (if available)
```typescript
// Leverage existing clause extraction infrastructure
private async enrichContextWithClauses(
  documents: Document[],
  userQuestion: string,
): Promise<ExtractedClausesContext> {
  const documentIds = documents.map((d) => d.id);

  // Option 1: Retrieve all clauses (if portfolio is small)
  const allClauses = await this.clauseRepository.findByDocuments(
    documentIds,
  );

  // Option 2: Use semantic search to find relevant clauses
  const relevantClauses = await this.semanticSearchService.searchClauses(
    userQuestion,
    documentIds,
    { limit: 20, threshold: 0.7 },
  );

  return {
    clauseCount: allClauses.length,
    relevantClauses: relevantClauses.map((c) => ({
      documentId: c.documentId,
      clauseId: c.id,
      type: c.clauseType,
      text: c.text,
      riskLevel: c.riskLevel,
    })),
  };
}
```

#### 5c. Summarize Risk Flags
```typescript
private async summarizeRisks(documents: Document[]): Promise<RiskSummary> {
  const criticalFlags = documents.flatMap((doc) =>
    doc.riskFlags
      .filter((flag) => flag.severity === 'CRITICAL')
      .map((flag) => ({
        documentId: doc.id,
        flagType: flag.type,
        description: flag.description,
      })),
  );

  return {
    criticalFlagCount: criticalFlags.length,
    topRisks: criticalFlags.slice(0, 5),
  };
}
```

#### 5d. Build Final Context Object
```typescript
const portfolioContext: PortfolioContext = {
  userQuestion,
  portfolio: {
    documentCount: documents.length,
    dateRange: {
      earliest: Math.min(...documents.map((d) => d.executionDate)),
      latest: Math.max(...documents.map((d) => d.executionDate)),
    },
    documentSummaries: documentMetadata,
  },
  extractedInsights: {
    clauses: relevantClauses,
    riskFlags: riskSummary,
  },
  conversationHistory: conversation.messages.slice(-5), // Last 5 messages
};
```

**Data Retrieved**:
- 45 contracts (example)
- Date range: 2022-2026
- Top 5 highest risk documents
- Related clauses from semantic search
- Previous conversation context

---

### **Stage 6: Claude API Call**

#### 6a. Build System Prompt
```typescript
// apps/backend/src/modules/chat/infrastructure/claude-portfolio-analyzer.service.ts
private buildSystemPrompt(context: PortfolioContext): string {
  return `You are an expert contract analyst specializing in portfolio analysis.

Your role is to:
1. Answer specific questions about contracts in the user's portfolio
2. Identify patterns, risks, and opportunities across documents
3. Provide actionable insights and recommendations
4. Always cite which documents your answers reference

Important guidelines:
- Be precise and fact-based; never hallucinate contract terms
- If information is not in the provided context, say so explicitly
- Highlight high-risk clauses or unfavorable terms
- Keep responses under 500 words but comprehensive

User's Portfolio Summary:
- Total Documents: ${context.portfolio.documentCount}
- Date Range: ${context.portfolio.dateRange.earliest} to ${context.portfolio.dateRange.latest}
- Critical Risk Flags: ${context.extractedInsights.riskFlags.criticalFlagCount}

Context about the user's documents and relevant clauses is provided below.
Cite documents by their title and document ID (e.g., "Service Agreement (doc-123)")`;
}
```

#### 6b. Build User Message with Context
```typescript
private buildUserMessage(context: PortfolioContext): string {
  const documentSummaries = context.portfolio.documentSummaries
    .map(
      (doc) => `
  - ${doc.title} (${doc.documentId})
    Type: ${doc.type}
    Counterparty: ${doc.counterparty}
    Execution Date: ${doc.executionDate}
    Risk Score: ${doc.riskScore}/100
`,
    )
    .join('\n');

  const relevantClauses = context.extractedInsights.clauses
    .map(
      (c) => `
  Clause in ${c.documentId} (${c.type}):
  ${c.text}
  Risk Level: ${c.riskLevel}
`,
    )
    .join('\n');

  return `
Documents in Portfolio:
${documentSummaries}

Relevant Clauses:
${relevantClauses}

User Question: ${context.userQuestion}

Please analyze the provided context and answer the user's question.
Cite specific documents by ID and quote relevant clauses.
`;
}
```

#### 6c. Call Claude API
```typescript
// Direct Anthropic SDK call
async sendToClaude(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const client = new Anthropic({
    apiKey: this.configService.get('CLAUDE_API_KEY'),
  });

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022', // Latest Claude model
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  // Extract text from response
  const assistantMessage = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return assistantMessage;
}
```

**API Request to Claude**:
```
POST https://api.anthropic.com/v1/messages
Authorization: Bearer sk-ant-...
Content-Type: application/json

{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "system": "You are an expert contract analyst...",
  "messages": [
    {
      "role": "user",
      "content": "Documents in Portfolio:\n- Service Agreement...\n\nUser Question: What are my highest risk contracts?"
    }
  ]
}
```

**Claude API Response** (example):
```json
{
  "content": [
    {
      "type": "text",
      "text": "Based on your portfolio analysis, I found 3 contracts with critical risk flags:\n\n1. **Service Agreement (doc-123)** - Risk Score: 78/100\n   - Contains unlimited liability clause\n   - No force majeure protection\n\n2. **NDA - TechCorp Inc (doc-456)** - Risk Score: 72/100\n   - Perpetual confidentiality obligations\n   - Overly broad definition of confidential information\n\n3. **Vendor Contract - GlobalSupply (doc-789)** - Risk Score: 68/100\n   - Automatic renewal clause with 90-day notice\n   - Payment terms unfavorable\n\nRecommendation: Review and negotiate the liability clauses in doc-123."
    }
  ],
  "usage": {
    "input_tokens": 1200,
    "output_tokens": 320
  }
}
```

---

### **Stage 7: Response Processing**

#### 7a. Extract Citations from Response
```typescript
private extractCitations(
  claudeResponse: string,
  context: PortfolioContext,
): Citation[] {
  const citations: Citation[] = [];

  // Find all document references like "(doc-123)"
  const docRefPattern = /\(doc-\d+\)/g;
  const matches = claudeResponse.matchAll(docRefPattern);

  for (const match of matches) {
    const docId = match[0].replace(/[()]/g, '');
    const document = context.portfolio.documentSummaries.find(
      (d) => d.documentId === docId,
    );

    if (document) {
      citations.push({
        documentId: docId,
        title: document.title,
        excerpt: extractNearbyText(claudeResponse, match.index),
      });
    }
  }

  return deduplicateCitations(citations);
}
```

#### 7b. Create Assistant Message Entity
```typescript
const assistantMessage = ChatMessage.create({
  conversationId,
  role: 'assistant',
  content: claudeResponse,
  citations: extractedCitations,
});
```

#### 7c. Save to Database
```typescript
await this.chatRepository.addMessage(conversationId, assistantMessage);
```

#### 7d. Update Conversation Metadata
```typescript
await this.chatRepository.updateConversation(conversationId, {
  lastMessageAt: new Date(),
  updatedAt: new Date(),
  // Auto-generate title from first message if not set
  title: conversation.title || generateTitle(userQuestion),
});
```

---

### **Stage 8: Response to Frontend**

#### 8a. Build Response DTO
```typescript
const responseDto: ChatMessageResponseDto = {
  id: assistantMessage.id,
  conversationId: assistantMessage.conversationId,
  role: 'assistant',
  content: assistantMessage.content,
  citations: assistantMessage.citations?.map((c) => ({
    documentId: c.documentId,
    title: c.title,
    excerpt: c.excerpt,
  })) || [],
  createdAt: assistantMessage.createdAt,
};

return responseDto; // Serialized to JSON by NestJS
```

#### 8b. HTTP Response
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "msg-789",
  "conversationId": "conv-123",
  "role": "assistant",
  "content": "Based on your portfolio analysis, I found 3 contracts with critical risk flags...",
  "citations": [
    {
      "documentId": "doc-123",
      "title": "Service Agreement",
      "excerpt": "Contains unlimited liability clause..."
    }
  ],
  "createdAt": "2026-06-09T14:30:15.000Z"
}
```

---

### **Stage 9: Frontend UI Update**

#### 9a. React Query Success Callback
```typescript
// usePortfolioChat hook → useMutation onSuccess
onSuccess: (response: ChatMessageResponse) => {
  // Update conversation cache with new assistant message
  queryClient.setQueryData(
    ['chat-conversation', conversationId],
    (old: ChatConversation) => ({
      ...old,
      messages: [...old.messages, response],
      lastMessageAt: response.createdAt,
    }),
  );
};
```

#### 9b. Component Re-renders with New Message
```typescript
// ChatWindow component receives updated messages from hook
export const ChatWindow: React.FC<{ conversationId: string }> = ({
  conversationId,
}) => {
  const { messages, isLoading } = usePortfolioChat(conversationId);

  return (
    <div className="chat-messages">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {isLoading && <ChatLoadingIndicator />}
    </div>
  );
};
```

#### 9c. Message Display Component
```typescript
// ChatMessage renders assistant response with citations
export const ChatMessage: React.FC<{ message: ChatMessage }> = ({
  message,
}) => {
  if (message.role === 'assistant') {
    return (
      <div className="assistant-message">
        <div className="message-content">{message.content}</div>
        {message.citations && message.citations.length > 0 && (
          <div className="citations">
            <strong>References:</strong>
            {message.citations.map((citation) => (
              <CitationBadge key={citation.documentId} citation={citation} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div className="user-message">{message.content}</div>;
};
```

#### 9d. User Sees Final Response
```
┌─────────────────────────────────────────────────────┐
│ You: What are my highest risk contracts?            │
│                                                     │
│ Assistant:                                          │
│ Based on your portfolio analysis, I found 3         │
│ contracts with critical risk flags:                 │
│                                                     │
│ 1. Service Agreement (doc-123) - Risk: 78/100      │
│    - Contains unlimited liability clause            │
│    - No force majeure protection                    │
│                                                     │
│ 2. NDA - TechCorp Inc (doc-456) - Risk: 72/100     │
│    - Perpetual confidentiality obligations          │
│                                                     │
│ [📄 Service Agreement] [📄 NDA - TechCorp]         │
│                                                     │
│ [Type your next question...]                        │
└─────────────────────────────────────────────────────┘
```

---

## Complete Flow Diagram

```
USER TYPES QUESTION
        ↓
    React Component
    (ChatInput.tsx)
        ↓
    usePortfolioChat Hook
    (useMutation)
        ↓
    chatService.sendMessage()
    (HTTP Client)
        ↓
    POST /api/v1/chat/conversations/:id/messages
        ↓
[BACKEND STARTS HERE]
        ↓
    ChatController
    (Route Handler)
        ↓
    CommandBus.execute()
    (SendMessageCommand)
        ↓
    SendMessageHandler
    (Authorization Check)
        ↓
    Save User Message → Database
        ↓
    PortfolioAnalyzerService
    (Prepare Context)
        ├─ Fetch Documents
        ├─ Retrieve Extracted Clauses
        ├─ Summarize Risks
        └─ Build Portfolio Context
        ↓
    ClaudePortfolioAnalyzerService
    (Build Prompts)
        ├─ System Prompt
        ├─ User Message with Context
        └─ Conversation History
        ↓
    Anthropic Claude API
    (Generate Response)
        ↓
    Extract Response & Citations
        ↓
    Create Assistant Message Entity
        ↓
    Save Assistant Message → Database
        ↓
    ChatMessageResponseDto
        ↓
    HTTP 200 OK (JSON Response)
        ↓
[FRONTEND RESUMES HERE]
        ↓
    useMutation onSuccess Callback
        ↓
    React Query Cache Update
        ↓
    Component Re-render with New Message
        ↓
    ChatWindow Displays
    ├─ Assistant Message
    ├─ Citations (with links to documents)
    └─ Ready for Next Question
        ↓
USER SEES ANSWER WITH CITATIONS
```

---

## Key Data Transformations

| Stage | Data Format | Example |
|-------|-------------|---------|
| 1. User Input | String | "What are my highest risk contracts?" |
| 2. API Request | JSON DTO | `{ "content": "What are..." }` |
| 3. Command | TypeScript Class | `SendMessageCommand` instance |
| 4. Context | TypeScript Object | `PortfolioContext` with documents, clauses |
| 5. Claude Input | String (Prompt) | System + User prompt concatenation |
| 6. Claude Output | String (Text) | "Based on analysis, I found 3 contracts..." |
| 7. Response Entity | ChatMessage Aggregate | Domain entity with citations |
| 8. API Response | JSON DTO | `ChatMessageResponseDto` |
| 9. Frontend State | React State | Messages array in React Query cache |
| 10. UI Render | React Components | ChatMessage component tree |

---

## Error Handling Paths

### Path 1: Conversation Not Found
```
SendMessageHandler
  └─ chatRepository.findById(conversationId)
     └─ null returned
        └─ throw ConversationNotFoundException
           └─ NestJS Exception Filter
              └─ HTTP 404 response
                 └─ Frontend error toast/display
```

### Path 2: Unauthorized Access
```
SendMessageHandler
  └─ Check: conversation.userId !== command.userId
     └─ throw UnauthorizedException
        └─ HTTP 401 response
           └─ Frontend redirects to login
```

### Path 3: No Documents in Portfolio
```
PortfolioAnalyzerService
  └─ documentRepository.findByUserAndOrg()
     └─ Empty array returned
        └─ throw NoDocumentsException
           └─ HTTP 400 response
              └─ Frontend displays: "Please upload contracts first"
```

### Path 4: Claude API Failure
```
ClaudePortfolioAnalyzerService
  └─ client.messages.create()
     └─ Network error / API down
        └─ throw ApiException
           └─ HTTP 502 response
              └─ Frontend retry with exponential backoff
                 └─ Error message: "Failed to generate response. Retrying..."
```

---

## Performance Considerations

| Operation | Typical Time | Optimization |
|-----------|--------------|--------------|
| Document Fetch | 50-200ms | Database indexes on userId + org |
| Semantic Search | 200-500ms | Cached embeddings, vector DB |
| Claude API Call | 1-3s | Streaming responses (optional Phase 3) |
| Save to DB | 50-100ms | Batch operations if possible |
| **Total E2E** | **1.5-4s** | Parallel context preparation |

---

## Security Checkpoints

| Checkpoint | Implementation | Location |
|-----------|-----------------|----------|
| Authentication | JWT token validation | SessionAuthGuard |
| Authorization | User ID matching | SendMessageHandler |
| Data Isolation | organizationId filtering | Repository queries |
| Input Validation | DTO validation | class-validator |
| Rate Limiting | Per-user API calls | Middleware (future) |
| Logging | All API calls logged | Logger service |

---

## State Management Summary

### Frontend State
```typescript
// React Query (server state)
{
  'chat-conversation:conv-123': {
    id: 'conv-123',
    messages: [
      { id: 'msg-1', role: 'user', content: '...' },
      { id: 'msg-2', role: 'assistant', content: '...' }
    ],
    lastMessageAt: '2026-06-09T...',
  }
}

// Component State (UI state)
{
  messageText: 'Type next question...',
  isSending: false,
  selectedCitation: 'doc-123',
}
```

### Backend State
```typescript
// Database (persistent state)
{
  ChatConversation: {
    id: 'conv-123',
    userId: 'user-456',
    title: 'Portfolio Risk Analysis',
    messages: [...]
  }
}

// In-Memory (ephemeral)
{
  portfolioContext: { ... },
  claudeResponse: '...'
}
```

---

## Testing the Flow

### Unit Tests
- **Controller**: Mock CommandBus, verify request handling
- **Handler**: Mock repositories, verify message saving and context building
- **AnalyzerService**: Mock Claude API, verify context preparation
- **Frontend Hook**: Mock httpService, verify state updates

### Integration Tests
- Create conversation → Send message → Retrieve conversation
- Full flow with real database (test database)
- Mock Claude API only

### E2E Tests
- User navigates to chat → Types question → Sees response → Clicks citation
- Backend analytics verify API calls
- Database verified for persisted state

---

## Summary

The flow from question to answer involves **9 stages**:

1. **User Input** - React component captures question
2. **Frontend API** - HTTP service sends to backend
3. **Controller** - NestJS route handler receives request
4. **CQRS Handler** - Validates and delegates to business logic
5. **Context Prep** - Retrieves documents and clauses from database
6. **Claude API** - Sends curated context to Claude for analysis
7. **Response Processing** - Extracts citations and saves message
8. **Frontend Response** - HTTP response with answer and citations
9. **UI Update** - React component re-renders with new message

Each stage involves data transformation, validation, and error handling to ensure a smooth, secure, and performant user experience.
