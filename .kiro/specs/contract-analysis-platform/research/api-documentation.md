# API Documentation Research

## Overview

The platform uses **@nestjs/swagger** to generate OpenAPI 3.0 specifications from TypeScript decorators on DTOs and controllers. The spec is served at `/api/docs` in non-production environments and can be exported as a JSON file for SDK generation.

---

## @nestjs/swagger Setup

### Installation

```bash
npm install @nestjs/swagger swagger-ui-express
```

### Bootstrap Configuration

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Only expose Swagger UI in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Contract Analysis Platform API')
      .setDescription(
        'AI-powered platform for ingesting, analyzing, and managing legal documents. ' +
        'Provides clause extraction, risk scoring, and due diligence workflow management.'
      )
      .setVersion('1.0')
      .setContact(
        'Platform Team',
        'https://contractintel.io',
        'api@contractintel.io'
      )
      .setLicense('Proprietary', 'https://contractintel.io/terms')
      .addServer('http://localhost:3000', 'Local Development')
      .addServer('https://demo.contractintel.io', 'Railway Demo')
      .addCookieAuth('session', {
        type: 'apiKey',
        in: 'cookie',
        name: 'session',
        description: 'Session cookie set after Auth0 login. Use /api/v1/auth/login to authenticate.',
      })
      .addTag('auth', 'Authentication and session management')
      .addTag('documents', 'Document ingestion and management')
      .addTag('clauses', 'Clause extraction and classification')
      .addTag('engagements', 'Due diligence engagement management')
      .addTag('annotations', 'Clause annotations and collaboration')
      .addTag('reports', 'Report generation and export')
      .addTag('audit', 'Audit trail and compliance')
      .build()

    const document = SwaggerModule.createDocument(app, config, {
      // Include all modules
      include: [],
      // Deep scan for decorators
      deepScanRoutes: true,
      // Ignore global prefix for Swagger
      ignoreGlobalPrefix: false,
      // Extra models not directly referenced in controllers
      extraModels: [],
    })

    // Serve Swagger UI
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        // Persist auth between page refreshes
        persistAuthorization: true,
        // Expand operations by default
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        // Show request duration
        displayRequestDuration: true,
        // Filter operations
        filter: true,
        // Show extensions
        showExtensions: true,
        // Try it out enabled by default
        tryItOutEnabled: true,
      },
      customSiteTitle: 'Contract Intel API Docs',
      customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; }
        .swagger-ui .topbar-wrapper img { content: url('/logo.png'); }
      `,
    })

    // Export OpenAPI spec as JSON (for SDK generation)
    const fs = await import('fs')
    fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2))
  }

  await app.listen(3000)
}
```

---

## DTO Annotations

### Request DTOs

```typescript
// src/modules/documents/infrastructure/dtos/upload-document.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator'

export class UploadDocumentDto {
  @ApiProperty({
    description: 'The engagement this document belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  engagementId: string

  @ApiPropertyOptional({
    description: 'Optional display name for the document (defaults to filename)',
    example: 'Acquisition Agreement - Draft 3',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  displayName?: string
}
```

### Response DTOs

```typescript
// src/modules/documents/infrastructure/dtos/document.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum DocumentStatusDto {
  UPLOADED = 'uploaded',
  QUEUED = 'queued',
  OCR_PROCESSING = 'ocr_processing',
  OCR_COMPLETE = 'ocr_complete',
  ANALYZING = 'analyzing',
  READY = 'ready',
  FAILED = 'failed',
}

export class DocumentResponseDto {
  @ApiProperty({
    description: 'Unique document identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string

  @ApiProperty({
    description: 'Original filename as uploaded',
    example: 'acquisition-agreement.pdf',
  })
  fileName: string

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
    minimum: 1,
    maximum: 52428800, // 50MB
  })
  fileSizeBytes: number

  @ApiProperty({
    description: 'Current processing status',
    enum: DocumentStatusDto,
    example: DocumentStatusDto.READY,
  })
  status: DocumentStatusDto

  @ApiPropertyOptional({
    description: 'SHA-256 checksum of the original file',
    example: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  })
  checksum?: string

  @ApiProperty({
    description: 'ISO 8601 timestamp of upload',
    example: '2024-01-01T12:00:00.000Z',
    format: 'date-time',
  })
  uploadedAt: string

  @ApiPropertyOptional({
    description: 'ISO 8601 timestamp when processing completed',
    example: '2024-01-01T12:02:30.000Z',
    format: 'date-time',
  })
  processedAt?: string
}
```

### Paginated Response Wrapper

```typescript
// src/common/dtos/paginated-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'

export class PaginationMetaDto {
  @ApiProperty({ example: 142 })
  total: number

  @ApiProperty({ example: 1 })
  page: number

  @ApiProperty({ example: 20 })
  pageSize: number

  @ApiProperty({ example: 8 })
  totalPages: number
}

export function PaginatedResponseDto<T>(ItemDto: new () => T) {
  class PaginatedResponse {
    @ApiProperty({ type: [ItemDto] })
    data: T[]

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto
  }

  return PaginatedResponse
}

// Usage:
export class PaginatedDocumentsDto extends PaginatedResponseDto(DocumentResponseDto) {}
```

### Error Response DTO

```typescript
// src/common/dtos/error-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ValidationErrorDto {
  @ApiProperty({ example: 'engagementId' })
  field: string

  @ApiProperty({ example: 'engagementId must be a UUID' })
  message: string
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean

  @ApiProperty({
    type: 'object',
    properties: {
      type: { type: 'string', example: 'https://contractintel.io/errors/validation-error' },
      title: { type: 'string', example: 'Validation Error' },
      status: { type: 'number', example: 422 },
      detail: { type: 'string', example: 'One or more fields failed validation' },
      correlationId: { type: 'string', example: 'req-abc123' },
      errors: { type: 'array', items: { $ref: '#/components/schemas/ValidationErrorDto' } },
    },
  })
  error: {
    type: string
    title: string
    status: number
    detail: string
    correlationId: string
    errors?: ValidationErrorDto[]
  }
}
```

---

## Controller Annotations

```typescript
// src/modules/documents/infrastructure/documents.controller.ts
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger'

@ApiTags('documents')
@ApiCookieAuth('session')
@Controller('documents')
export class DocumentsController {

  @Post()
  @ApiOperation({
    summary: 'Upload a document',
    description: 'Upload a legal document (PDF, DOCX, TIFF, PNG) for analysis. ' +
      'Returns a documentId immediately; processing happens asynchronously. ' +
      'Maximum file size: 50MB.',
    operationId: 'uploadDocument',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document file and metadata',
    schema: {
      type: 'object',
      required: ['file', 'engagementId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The document file (PDF, DOCX, TIFF, PNG). Max 50MB.',
        },
        engagementId: {
          type: 'string',
          format: 'uuid',
          description: 'The engagement this document belongs to',
        },
        displayName: {
          type: 'string',
          description: 'Optional display name (defaults to filename)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully. Processing queued.',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format or missing required fields',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to upload to this engagement',
  })
  @ApiResponse({
    status: 413,
    description: 'File exceeds 50MB limit',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'File failed virus scan or validation',
    type: ErrorResponseDto,
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: RequestUser,
  ): Promise<DocumentResponseDto> {
    // ...
  }

  @Get()
  @ApiOperation({
    summary: 'List documents',
    description: 'Returns a paginated list of documents for the authenticated tenant.',
    operationId: 'listDocuments',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'engagementId', required: false, type: String, format: 'uuid' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: DocumentStatusDto,
    description: 'Filter by processing status',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of documents',
    type: PaginatedDocumentsDto,
  })
  async listDocuments(/* ... */): Promise<PaginatedDocumentsDto> {
    // ...
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get document by ID',
    operationId: 'getDocument',
  })
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, type: DocumentResponseDto })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocument(@Param('id') id: string): Promise<DocumentResponseDto> {
    // ...
  }
}
```

---

## OpenAPI Spec Generation

### Automated Generation Script

```typescript
// scripts/generate-openapi.ts
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from '../src/app.module'
import * as fs from 'fs'
import * as path from 'path'

async function generateSpec() {
  const app = await NestFactory.create(AppModule, { logger: false })

  const config = new DocumentBuilder()
    .setTitle('Contract Analysis Platform API')
    .setVersion('1.0')
    .addCookieAuth('session')
    .build()

  const document = SwaggerModule.createDocument(app, config)

  // Write JSON spec
  const jsonPath = path.join(__dirname, '../openapi.json')
  fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2))
  console.log(`OpenAPI spec written to ${jsonPath}`)

  // Write YAML spec
  const yaml = await import('js-yaml')
  const yamlPath = path.join(__dirname, '../openapi.yaml')
  fs.writeFileSync(yamlPath, yaml.dump(document))
  console.log(`OpenAPI spec written to ${yamlPath}`)

  await app.close()
}

generateSpec().catch(console.error)
```

```json
// package.json scripts
{
  "scripts": {
    "docs:generate": "ts-node scripts/generate-openapi.ts",
    "docs:serve": "npx @redocly/cli preview-docs openapi.json"
  }
}
```

---

## SDK Generation

### TypeScript SDK with openapi-typescript-codegen

```bash
# Install generator
npm install -D openapi-typescript-codegen

# Generate TypeScript SDK
npx openapi-typescript-codegen \
  --input openapi.json \
  --output ./sdk \
  --client fetch \
  --name ContractIntelClient \
  --useOptions \
  --useUnionTypes
```

Generated SDK structure:

```
sdk/
  core/
    ApiError.ts
    ApiRequestOptions.ts
    BaseHttpRequest.ts
    CancelablePromise.ts
    FetchHttpRequest.ts
    OpenAPI.ts
    request.ts
  models/
    DocumentResponseDto.ts
    ClauseResponseDto.ts
    EngagementResponseDto.ts
    ErrorResponseDto.ts
    ...
  services/
    DocumentsService.ts
    ClausesService.ts
    EngagementsService.ts
    ...
  index.ts
```

### Usage in React Frontend

```typescript
// src/lib/api-client.ts
import { ContractIntelClient } from '../../sdk'

export const apiClient = new ContractIntelClient({
  BASE: '/api/v1',
  WITH_CREDENTIALS: true, // Send session cookie
})

// Usage in React Query
const { data: documents } = useQuery({
  queryKey: ['documents', engagementId],
  queryFn: () => apiClient.documents.listDocuments({ engagementId }),
})
```

### Alternative: openapi-typescript (type-only)

```bash
npm install -D openapi-typescript

# Generate types only (no runtime code)
npx openapi-typescript openapi.json --output src/types/api.d.ts
```

---

## Validation Integration

### class-validator + class-transformer

```typescript
// src/main.ts
import { ValidationPipe } from '@nestjs/common'

app.useGlobalPipes(
  new ValidationPipe({
    // Transform plain objects to DTO instances
    transform: true,
    // Strip unknown properties
    whitelist: true,
    // Throw on unknown properties
    forbidNonWhitelisted: true,
    // Return all validation errors, not just first
    stopAtFirstError: false,
    // Custom error factory for RFC 7807 format
    exceptionFactory: (errors) => {
      const validationErrors = errors.map((error) => ({
        field: error.property,
        message: Object.values(error.constraints || {}).join(', '),
      }))
      
      throw new ValidationException(validationErrors)
    },
  })
)
```

---

## Swagger UI Access Control

```typescript
// Only expose in non-production environments
if (config.get('NODE_ENV') !== 'production') {
  SwaggerModule.setup('api/docs', app, document)
}

// Or protect with basic auth in staging
if (config.get('NODE_ENV') === 'staging') {
  app.use('/api/docs', basicAuth({
    users: { admin: config.get('SWAGGER_PASSWORD') },
    challenge: true,
  }))
  SwaggerModule.setup('api/docs', app, document)
}
```

---

## Best Practices

1. **Every endpoint needs `@ApiOperation`** — summary and operationId are required
2. **Every response code needs `@ApiResponse`** — document all possible responses including errors
3. **Use `@ApiProperty` on all DTO fields** — include examples, descriptions, constraints
4. **Use `operationId`** — enables clean SDK method names (e.g., `uploadDocument` → `documentsService.uploadDocument()`)
5. **Group with `@ApiTags`** — logical grouping in Swagger UI
6. **Document file uploads** — use `@ApiConsumes('multipart/form-data')` with schema
7. **Version the spec** — include version in `DocumentBuilder.setVersion()`
8. **Export spec in CI** — generate `openapi.json` as a CI artifact for SDK consumers
9. **Validate spec** — use `@redocly/cli lint openapi.json` in CI to catch issues
10. **Keep DTOs separate from domain** — never expose domain objects directly in API responses

---

## CI Integration

```yaml
# .github/workflows/api-docs.yml
name: Generate API Docs

on:
  push:
    branches: [main]

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate OpenAPI spec
        run: npm run docs:generate
      
      - name: Lint OpenAPI spec
        run: npx @redocly/cli lint openapi.json
      
      - name: Upload spec as artifact
        uses: actions/upload-artifact@v3
        with:
          name: openapi-spec
          path: openapi.json
      
      - name: Generate TypeScript SDK
        run: npm run sdk:generate
      
      - name: Upload SDK as artifact
        uses: actions/upload-artifact@v3
        with:
          name: typescript-sdk
          path: sdk/
```
