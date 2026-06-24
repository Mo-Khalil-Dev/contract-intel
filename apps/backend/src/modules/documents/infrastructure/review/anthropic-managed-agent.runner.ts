import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AppConfigService } from '../../../../config/app-config.service';
import {
  ContractReviewInput,
  ContractReviewResult,
  IContractReviewRunner,
} from '../../domain/ports/contract-review-runner.port';

/**
 * Track A — Anthropic Managed Agents (CMA).
 *
 * The agent is created ONCE (in the Console or a setup script) with the
 * playbook as its system prompt and the MCP server attached; its id lives
 * in CONTRACT_REVIEW_AGENT_ID. This adapter only opens a SESSION per run:
 *   sessions.create → open event stream → send the documentId → drain to
 *   terminal idle → return the agent's final message as the report.
 *
 * We capture the report from the agent's final message (the system prompt
 * instructs it to emit the §4 report as its last message), so there's no
 * /mnt/session/outputs file plumbing. The MCP loop runs server-side; we
 * never handle tool_result.
 */
@Injectable()
export class AnthropicManagedAgentRunner implements IContractReviewRunner {
  private readonly logger = new Logger(AnthropicManagedAgentRunner.name);
  private readonly client: Anthropic;

  constructor(private readonly config: AppConfigService) {
    this.client = new Anthropic({ apiKey: this.config.claudeApiKey });
  }

  async review(input: ContractReviewInput): Promise<ContractReviewResult> {
    const agentId = this.config.contractReviewAgentId;
    const environmentId = this.config.contractReviewEnvId;
    if (!agentId || !environmentId) {
      throw new Error(
        'CONTRACT_REVIEW_AGENT_ID / CONTRACT_REVIEW_ENV_ID are not configured. ' +
          'Create the agent + environment once and set both env vars.',
      );
    }

    // Session per run — agent + environment are pre-created and reused.
    const session = await this.client.beta.sessions.create({
      agent: agentId,
      environment_id: environmentId,
      title: `Contract review ${input.documentId}`,
    });

    // Stream-first: open before sending so we don't miss early events.
    const stream = await this.client.beta.sessions.events.stream(session.id);
    await this.client.beta.sessions.events.send(session.id, {
      events: [
        {
          type: 'user.message',
          content: [
            {
              type: 'text',
              text:
                `Review document ${input.documentId} against the Company Legal ` +
                `Playbook and produce the risk report.`,
            },
          ],
        },
      ],
    });

    let report = '';
    for await (const event of stream) {
      if (event.type === 'agent.message') {
        for (const block of event.content) {
          if (block.type === 'text') report += block.text;
        }
      }
      if (event.type === 'session.status_terminated') break;
      if (
        event.type === 'session.status_idle' &&
        event.stop_reason?.type !== 'requires_action'
      ) {
        break; // end_turn / retries_exhausted — both terminal
      }
    }

    if (!report.trim()) {
      throw new Error(
        `Managed Agent session ${session.id} produced no report text.`,
      );
    }

    this.logger.log(
      `Contract review complete (anthropic) doc=${input.documentId} session=${session.id}`,
    );
    return { markdown: report.trim(), runtime: 'anthropic', runId: session.id };
  }
}
