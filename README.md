# Contract Analysis Platform

AI-powered contract analysis and due diligence platform built with NestJS, React, and Clean Architecture.

## Architecture

- **Backend**: NestJS + TypeScript
- **Frontend**: React + TypeScript + TailwindCSS + React Query
- **Pattern**: Clean Architecture + DDD + CQRS + Vertical Slicing
- **Deployment**: GCP Cloud Run (production), Railway (demo)

> **Note**: Persistence layer (ORM, database) will be introduced incrementally as features need them.

## Project Structure

```
contract-intel-v2/
├── apps/
│   ├── backend/          # NestJS API
│   │   └── src/
│   │       ├── modules/  # Feature modules (vertical slices)
│   │       ├── shared/   # Shared kernel (domain, exceptions, infrastructure)
│   │       └── config/   # Configuration
│   └── frontend/         # React SPA
│       └── src/
│           ├── pages/    # Page components
│           ├── components/ # UI components
│           ├── hooks/    # Custom hooks
│           ├── api/      # API client
│           └── types/    # TypeScript types
└── .kiro/
    └── specs/            # Spec-driven development docs
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up backend environment**:
   ```bash
   cd apps/backend
   cp .env.example .env
   ```

### Development

Run both backend and frontend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Backend (http://localhost:3000)
npm run dev:backend

# Frontend (http://localhost:5173)
npm run dev:frontend
```

### API Documentation

When running in development mode, Swagger docs are available at:
- http://localhost:3000/api/docs

### Testing

```bash
# Run all tests
npm test

# Backend tests only
npm test --workspace=apps/backend

# Frontend tests only
npm test --workspace=apps/frontend
```

### Linting & Formatting

```bash
# Lint all workspaces
npm run lint

# Format all files
npm run format
```

## Key Features (Phase 1)

- ✅ Home screen with dashboard metrics
- 🚧 Document upload and ingestion
- 🚧 OCR processing (Google Document AI)
- 🚧 AI-powered clause extraction (Claude API)
- 🚧 Risk scoring and flagging
- 🚧 Due diligence workflow management
- 🚧 Collaboration and annotations
- 🚧 Audit trail
- 🚧 Reporting and export

## Tech Stack Details

### Backend
- **Framework**: NestJS 10
- **CQRS**: @nestjs/cqrs
- **Logging**: pino + nestjs-pino
- **Validation**: class-validator + class-transformer
- **API Docs**: @nestjs/swagger
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query (server state)
- **HTTP Client**: Axios
- **Forms**: Formik + Yup
- **Routing**: React Router v6
- **Testing**: Vitest

### Infrastructure
- **Storage**: GCP Cloud Storage
- **OCR**: Google Document AI
- **AI**: Claude API (Anthropic)
- **Queue**: BullMQ + Redis (prod), pg-boss (demo), in-memory (dev)
- **Secrets**: GCP Secret Manager (prod), env vars (dev)
- **APM**: Dynatrace (backend), LogRocket (frontend)
- **Analytics**: PostHog

## Environment Variables

See `apps/backend/.env.example` for all available configuration options.

Key variables:
- `AUTH0_*`: Auth0 configuration
- `STORAGE_DRIVER`: local | gcs
- `OCR_DRIVER`: mock | google-document-ai
- `QUEUE_DRIVER`: memory | pg-boss | bullmq
- `CLAUDE_API_KEY`: Anthropic API key

## Deployment

### Railway (Demo)
```bash
# Deploy via Railway CLI
railway up
```

### GCP (Production)
```bash
# Build and deploy to Cloud Run
npm run build
gcloud run deploy contract-intel-api --source .
```

## Architecture Decisions

See `.kiro/specs/contract-analysis-platform/design.md` for detailed architecture documentation.

Key patterns:
- **Clean Architecture**: Dependencies point inward
- **DDD Domain Layer**: Aggregates, entities, value objects, domain events
- **CQRS**: Commands mutate, queries read directly
- **Vertical Slicing**: Each feature owns its full stack
- **Ports & Adapters**: Infrastructure abstracted behind interfaces
- **Backend-Driven UI**: Frontend is a declarative view engine

## Contributing

1. Follow the established architecture patterns
2. Write tests for all new features
3. Use conventional commits
4. Run linting and formatting before committing

## License

Proprietary - All rights reserved
