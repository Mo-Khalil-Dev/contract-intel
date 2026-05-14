import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { Public } from '../../auth/infrastructure/decorators/public.decorator';
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
import { StorageKey } from '../domain/value-objects/storage-key.vo';
import { LocalStorageDriver } from './storage/local-storage.driver';
import { InitiateUploadDto, UploadResponseDto } from './dtos/initiate-upload.dto';
import { CompleteUploadDto, UploadStatusDto } from './dtos/complete-upload.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    /** Concrete LocalStorageDriver — only used by the raw PUT endpoint
     *  below, which only exists when STORAGE_DRIVER=local. In gcs mode
     *  the browser PUTs straight to GCS and this method is never hit. */
    private readonly localStorage: LocalStorageDriver,
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

  // ── Step 2: raw PUT (local-dev only) ─────────────────────────────

  /**
   * The browser PUTs file bytes here when running against the local
   * storage driver. The `@Public()` decorator is necessary because the
   * presigned URL pattern doesn't carry our session cookie — instead,
   * the storageKey itself is the capability. The key is opaque
   * (`{documentId}.pdf`) and unguessable; the document row was already
   * created by /initiate which IS authenticated.
   *
   * In GCS mode this route is unreachable (browser PUTs to googleapis.com).
   */
  @Public()
  @Put('upload/raw/:storageKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  async raw(
    @Param('storageKey') rawKey: string,
    @Req() req: Request,
  ): Promise<void> {
    const key = StorageKey.fromString(decodeURIComponent(rawKey));
    await this.localStorage.writeStream(key, req);
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
}
