import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CONTRACT_REVIEW_RUNNER,
  IContractReviewRunner,
} from '../../domain/ports/contract-review-runner.port';
import {
  RunContractReviewCommand,
  RunContractReviewResult,
} from './run-contract-review.command';

/**
 * Drives the Playbook-Driven Contract Review agent for one document and
 * returns the §4 risk report. Runtime-agnostic — the injected runner is
 * whichever adapter the boot-time factory bound (Anthropic CMA or
 * AgentCore), selected by CONTRACT_REVIEW_RUNTIME.
 *
 * Synchronous: the review is a multi-step agent run (tens of seconds), so
 * the HTTP request blocks until the report is ready. Streaming the tool-call
 * trace to the UI is a later enhancement; persisting the markdown is the
 * other (add Document.reviewMarkdown + a store port).
 */
@CommandHandler(RunContractReviewCommand)
export class RunContractReviewHandler
  implements ICommandHandler<RunContractReviewCommand, RunContractReviewResult>
{
  private readonly logger = new Logger(RunContractReviewHandler.name);

  constructor(
    @Inject(CONTRACT_REVIEW_RUNNER)
    private readonly runner: IContractReviewRunner,
  ) {}

  async execute(
    command: RunContractReviewCommand,
  ): Promise<RunContractReviewResult> {
    this.logger.log(
      `Running contract review doc=${command.documentId} org=${command.orgId}`,
    );
    const result = await this.runner.review({ documentId: command.documentId });
    return {
      documentId: command.documentId,
      markdown: result.markdown,
      runtime: result.runtime,
      runId: result.runId,
    };
  }
}
