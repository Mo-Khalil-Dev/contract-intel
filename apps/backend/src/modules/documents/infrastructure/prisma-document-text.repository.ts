import { Inject, Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { InfrastructureException } from '../../../shared/exceptions/app-error';
import { DocumentText } from '../domain/document-text.aggregate';
import { IDocumentTextRepository } from '../domain/document-text.repository';
import {
  IStorageService,
  STORAGE_SERVICE,
} from '../domain/ports/storage-service.port';
import { DocumentId } from '../domain/value-objects/document-id.vo';
import { StorageKey } from '../domain/value-objects/storage-key.vo';
import { DocumentTextBlob, DocumentTextMapper } from './document-text.mapper';

/**
 * Persistence for the DocumentText aggregate.
 *
 * Split-store: the JSON blob (full text + per-page detail) lives in
 * IStorageService at `{documentId}.text.json`; a thin metadata row in
 * Prisma carries the keys we need to list/filter/audit without fetching
 * the blob. See ocr-design.md §3 (locked decision 2026-05-15).
 *
 * Write order: blob first, then metadata. If the metadata write fails
 * the blob remains in storage as a small orphan — acceptable in v1; a
 * GC pass could sweep these later. The reverse order would risk a row
 * pointing at a missing blob, which is harder to recover from.
 */
@Injectable()
export class PrismaDocumentTextRepository implements IDocumentTextRepository {
  private readonly logger = new Logger(PrismaDocumentTextRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async findByDocumentId(id: DocumentId): Promise<DocumentText | null> {
    const row = await this.prisma.documentText.findUnique({
      where: { documentId: id.value },
    });
    if (!row) return null;

    const stream = await this.storage.openReadStream(
      StorageKey.fromString(row.storageKey),
    );
    const blob = await readJson<DocumentTextBlob>(stream);
    return DocumentTextMapper.toDomain(id.value, blob);
  }

  async save(text: DocumentText): Promise<void> {
    const storageKey = StorageKey.forArtifact(text.documentId, 'text', 'json');
    const { row, blob } = DocumentTextMapper.toPersistence(text, storageKey.value);

    // 1. Write the blob. JSON.stringify here is fine — even a 200-page
    //    contract's text fits comfortably in memory.
    const json = JSON.stringify(blob);
    await this.storage.writeStream(
      storageKey,
      Readable.from([json]),
      'application/json',
    );

    // 2. Upsert the metadata row. Re-runs of OCR overwrite the row
    //    (no history in v1).
    await this.prisma.documentText.upsert({
      where: { documentId: row.documentId },
      create: row,
      update: {
        storageKey: row.storageKey,
        textLength: row.textLength,
        confidence: row.confidence,
        minPageConfidence: row.minPageConfidence,
        language: row.language,
        driver: row.driver,
        pageCount: row.pageCount,
        extractedAt: row.extractedAt,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Persisted DocumentText for ${text.documentId.value} (${text.text.length} chars, driver=${text.driver.value})`,
    );
  }
}

async function readJson<T>(stream: Readable): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new InfrastructureException(
      'CORRUPT_DOCUMENT_TEXT_BLOB',
      `Failed to parse stored OCR blob: ${(err as Error).message}`,
    );
  }
}
