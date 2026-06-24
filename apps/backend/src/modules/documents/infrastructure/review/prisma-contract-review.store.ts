import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  ContractReviewStatus,
  IContractReviewStore,
  StoredContractReview,
} from '../../domain/ports/contract-review-store.port';
import type { ContractReviewRuntime } from '../../domain/ports/contract-review-runner.port';

@Injectable()
export class PrismaContractReviewStore implements IContractReviewStore {
  constructor(private readonly prisma: PrismaService) {}

  async get(
    documentId: string,
    orgId: string,
  ): Promise<StoredContractReview | null> {
    const row = await this.prisma.document.findFirst({
      where: { id: documentId, orgId },
      select: {
        id: true,
        reviewStatus: true,
        reviewMarkdown: true,
        reviewRuntime: true,
        reviewError: true,
        reviewedAt: true,
      },
    });
    if (!row) return null;
    return {
      documentId: row.id,
      status: row.reviewStatus as ContractReviewStatus,
      markdown: row.reviewMarkdown,
      runtime: row.reviewRuntime as ContractReviewRuntime | null,
      error: row.reviewError,
      reviewedAt: row.reviewedAt,
    };
  }

  async markRunning(documentId: string, orgId: string): Promise<boolean> {
    // Org-scoped guard via updateMany's where; count===0 means not visible.
    const res = await this.prisma.document.updateMany({
      where: { id: documentId, orgId },
      data: { reviewStatus: 'running', reviewError: null },
    });
    return res.count > 0;
  }

  async saveComplete(
    documentId: string,
    markdown: string,
    runtime: ContractReviewRuntime,
    reviewedAt: Date,
  ): Promise<void> {
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        reviewStatus: 'complete',
        reviewMarkdown: markdown,
        reviewRuntime: runtime,
        reviewError: null,
        reviewedAt,
      },
    });
  }

  async saveFailed(documentId: string, error: string): Promise<void> {
    await this.prisma.document.update({
      where: { id: documentId },
      data: { reviewStatus: 'failed', reviewError: error.slice(0, 2000) },
    });
  }
}
