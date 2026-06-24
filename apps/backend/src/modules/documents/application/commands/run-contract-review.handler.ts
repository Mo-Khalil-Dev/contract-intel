import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CONTRACT_REVIEW_RUNNER,
  IContractReviewRunner,
} from '../../domain/ports/contract-review-runner.port';
import {
  CONTRACT_REVIEW_STORE,
  IContractReviewStore,
} from '../../domain/ports/contract-review-store.port';
import {
  RunContractReviewCommand,
  RunContractReviewResult,
} from './run-contract-review.command';

/**
 * Starts the Playbook-Driven Contract Review agent for one document.
 *
 * The agent run can exceed the HTTP request window (multi-minute, multi-step),
 * so this is FIRE-AND-FORGET: we mark the review 'running', kick off the run
 * in the background (NOT awaited), and return immediately. The runner persists
 * 'complete' + markdown (or 'failed' + error) when it finishes; the frontend
 * polls GetContractReviewQuery for the result.
 *
 * Runtime-agnostic — the injected runner is whichever adapter the boot-time
 * factory bound (Anthropic CMA or AgentCore), per CONTRACT_REVIEW_RUNTIME.
 */
@CommandHandler(RunContractReviewCommand)
export class RunContractReviewHandler
  implements ICommandHandler<RunContractReviewCommand, RunContractReviewResult>
{
  private readonly logger = new Logger(RunContractReviewHandler.name);

  constructor(
    @Inject(CONTRACT_REVIEW_RUNNER)
    private readonly runner: IContractReviewRunner,
    @Inject(CONTRACT_REVIEW_STORE)
    private readonly store: IContractReviewStore,
  ) {}

  async execute(
    command: RunContractReviewCommand,
  ): Promise<RunContractReviewResult> {
    const { documentId, orgId } = command;

    const visible = await this.store.markRunning(documentId, orgId);
    if (!visible) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    this.logger.log(`Starting contract review doc=${documentId} org=${orgId}`);

    // Background run — deliberately NOT awaited so the request returns now.
    void this.run(documentId);

    return { documentId, status: 'running' };
  }

  private async run(documentId: string): Promise<void> {
    try {
      const result = await this.runner.review({ documentId });
      await this.store.saveComplete(
        documentId,
        result.markdown,
        result.runtime,
        new Date(),
      );
      this.logger.log(
        `Contract review complete doc=${documentId} runtime=${result.runtime} runId=${result.runId ?? '-'}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Contract review failed doc=${documentId}: ${message}`,
      );
      await this.store
        .saveFailed(documentId, message)
        .catch((e) =>
          this.logger.error(
            `Failed to persist review failure doc=${documentId}: ${e}`,
          ),
        );
    }
  }
}
