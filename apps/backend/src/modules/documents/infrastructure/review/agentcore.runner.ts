import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from '@aws-sdk/client-bedrock-agentcore';
import { AppConfigService } from '../../../../config/app-config.service';
import {
  ContractReviewInput,
  ContractReviewResult,
  IContractReviewRunner,
} from '../../domain/ports/contract-review-runner.port';

/**
 * Track B — AWS Bedrock AgentCore.
 *
 * CMA is not available on Bedrock; AgentCore hosts its own runtime and reaches
 * Claude via Bedrock. The agent itself (agents/contract-review-agentcore/, a
 * Strands-TS container) is deployed separately and configured — on the AWS
 * side — with the SAME MCP server URL and the SAME playbook system prompt.
 * This adapter just invokes that deployed runtime and returns its markdown.
 *
 * The shared MCP tool layer is the through-line: one tool layer, two runtimes.
 * Selected by CONTRACT_REVIEW_RUNTIME=agentcore via the factory in
 * DocumentsModule — zero change to the command/persistence/UI.
 */
@Injectable()
export class AgentCoreRunner implements IContractReviewRunner {
  private readonly logger = new Logger(AgentCoreRunner.name);
  private readonly client: BedrockAgentCoreClient;

  constructor(private readonly config: AppConfigService) {
    this.client = new BedrockAgentCoreClient({ region: this.config.awsRegion });
  }

  async review(input: ContractReviewInput): Promise<ContractReviewResult> {
    const arn = this.config.contractReviewAgentCoreRuntimeArn;
    if (!arn) {
      throw new Error(
        'CONTRACT_REVIEW_AGENTCORE_RUNTIME_ARN is not configured. Create the ' +
          'AgentCore runtime and set the ARN before selecting the agentcore runtime.',
      );
    }

    // runtimeSessionId must be ≥ 33 chars; two UUIDs (joined) satisfy it.
    const sessionId = `${randomUUID()}${randomUUID()}`.slice(0, 40);

    const res = await this.client.send(
      new InvokeAgentRuntimeCommand({
        agentRuntimeArn: arn,
        runtimeSessionId: sessionId,
        contentType: 'application/json',
        accept: 'application/json',
        payload: new TextEncoder().encode(
          JSON.stringify({ documentId: input.documentId }),
        ),
      }),
    );

    const body = res.response ? await res.response.transformToString() : '';
    if (!body) {
      throw new Error('AgentCore runtime returned an empty response.');
    }

    let parsed: { markdown?: string; error?: string };
    try {
      parsed = JSON.parse(body);
    } catch {
      // Tolerate a runtime that returns the raw markdown rather than JSON.
      parsed = { markdown: body };
    }
    if (parsed.error) throw new Error(`AgentCore agent error: ${parsed.error}`);
    if (!parsed.markdown?.trim()) {
      throw new Error('AgentCore agent produced no report text.');
    }

    this.logger.log(
      `Contract review complete (agentcore) doc=${input.documentId} session=${sessionId}`,
    );
    return {
      markdown: parsed.markdown.trim(),
      runtime: 'agentcore',
      runId: sessionId,
    };
  }
}
