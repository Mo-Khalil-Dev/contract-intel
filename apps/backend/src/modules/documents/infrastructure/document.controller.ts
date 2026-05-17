import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  CurrentUser,
  RequestUser,
} from '../../auth/infrastructure/decorators/current-user.decorator';
import {
  InitiateUploadCommand,
  InitiateUploadResult,
} from '../application/commands/initiate-upload.command';
import { CompleteUploadCommand } from '../application/commands/complete-upload.command';
import { FailUploadCommand } from '../application/commands/fail-upload.command';
import {
  GetUploadStatusQuery,
  GetUploadStatusResult,
} from '../application/queries/get-upload-status.query';
import {
  GetProcessingStatusQuery,
  GetProcessingStatusResult,
} from '../application/queries/get-processing-status.query';
import { RetryOcrProcessingCommand } from '../application/commands/retry-ocr-processing.command';
import { GetClausesForDocumentQuery } from '../../clauses/application/queries/get-clauses-for-document.query';
import type { ClauseDto } from '../../clauses/application/queries/clause.dto';
import {
  ExtractionRunStatusDto,
  GetExtractionRunStatusQuery,
} from '../../clauses/application/queries/get-extraction-run-status.query';
import { StorageKey } from '../domain/value-objects/storage-key.vo';
import { IStorageService, STORAGE_SERVICE } from '../domain/ports/storage-service.port';
import { InitiateUploadDto, UploadResponseDto } from './dtos/initiate-upload.dto';
import { CompleteUploadDto, UploadStatusDto } from './dtos/complete-upload.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    /** The active storage driver chosen by the factory in DocumentsModule
     *  (LocalStorageDriver or GcsStorageDriver). The controller doesn't
     *  care which one — it just calls writeStream on the port. */
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  // ── Step 1: initiate ─────────────────────────────────────────────

  @Post('upload/initiate')
  @ApiOkResponse({ type: UploadResponseDto })
  async initiate(
    @CurrentUser() user: RequestUser,
    @Body() body: InitiateUploadDto,
  ): Promise<UploadResponseDto> {
    const result = await this.commandBus.execute<
      InitiateUploadCommand,
      InitiateUploadResult
    >(new InitiateUploadCommand(body.fileName, body.fileSize, body.fileType, user.userId));
    return {
      documentId: result.documentId,
      uploadUrl: result.uploadUrl,
      method: result.method,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  // ── Step 2: raw PUT — backend-proxied for all storage backends ───

  /**
   * The browser PUTs file bytes here. The controller streams them to
   * whichever storage driver is active (local FS or GCS) via the
   * IStorageService port. Auth-guarded — the session cookie authenticates
   * every byte that flows through our perimeter.
   *
   * In a future "direct-upload" mode the URL minted by /initiate could
   * point elsewhere (presigned GCS) and bypass this route entirely.
   */
  @Put('upload/raw/:storageKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  async raw(
    @CurrentUser() _user: RequestUser,
    @Param('storageKey') rawKey: string,
    @Req() req: Request,
  ): Promise<void> {
    const key = StorageKey.fromString(decodeURIComponent(rawKey));
    const contentType = req.headers['content-type'];
    await this.storage.writeStream(key, req, contentType);
  }

  // ── Step 3: complete ─────────────────────────────────────────────

  @Post('upload/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async complete(
    @CurrentUser() user: RequestUser,
    @Body() body: CompleteUploadDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new CompleteUploadCommand(body.documentId, user.userId),
    );
  }

  // ── Step 3-bis: fail (called by the client on its own discretion) ─

  @Post('upload/:documentId/fail')
  @HttpCode(HttpStatus.NO_CONTENT)
  async fail(
    @CurrentUser() user: RequestUser,
    @Param('documentId') documentId: string,
    @Body() body: { reason: string },
  ): Promise<void> {
    await this.commandBus.execute(
      new FailUploadCommand(documentId, body.reason, user.userId),
    );
  }

  // ── Step 4: status polling ───────────────────────────────────────

  @Get(':documentId/status')
  @ApiOkResponse({ type: UploadStatusDto })
  async status(
    @CurrentUser() user: RequestUser,
    @Param('documentId') documentId: string,
  ): Promise<UploadStatusDto> {
    const result: GetUploadStatusResult = await this.queryBus.execute(
      new GetUploadStatusQuery(documentId, user.userId),
    );
    return {
      documentId: result.documentId,
      status: result.status,
      uploadedAt: result.uploadedAt,
      failureReason: result.failureReason,
    };
  }

  // ── Phase 7: OCR processing status + retry ────────────────────────

  @Get(':documentId/processing-status')
  async processingStatus(
    @CurrentUser() user: RequestUser,
    @Param('documentId') documentId: string,
  ): Promise<GetProcessingStatusResult> {
    return this.queryBus.execute(
      new GetProcessingStatusQuery(documentId, user.userId),
    );
  }

  @Post(':documentId/retry-ocr')
  @HttpCode(HttpStatus.NO_CONTENT)
  async retryOcr(
    @CurrentUser() user: RequestUser,
    @Param('documentId') documentId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new RetryOcrProcessingCommand(documentId, user.userId),
    );
  }

  // ── Phase 8: clause extraction read endpoints ─────────────────────
  //
  // Both endpoints inherit org scoping from the upstream processing
  // status query — by the time the frontend polls these, the document
  // has already been confirmed visible to the requester via the polling
  // flow that started on /processing/:id. The query handlers themselves
  // are system-scoped (findById, not findByIdForOrg) because they're
  // also called from background event handlers.

  @Get(':documentId/clauses')
  async clauses(
    @Param('documentId') documentId: string,
  ): Promise<ClauseDto[]> {
    return this.queryBus.execute(new GetClausesForDocumentQuery(documentId));
  }

  @Get(':documentId/extraction-status')
  async extractionStatus(
    @Param('documentId') documentId: string,
  ): Promise<ExtractionRunStatusDto> {
    return this.queryBus.execute(
      new GetExtractionRunStatusQuery(documentId),
    );
  }
}
