import { Injectable } from '@nestjs/common';
import {
  ContractReviewInput,
  ContractReviewResult,
  IContractReviewRunner,
} from '../../domain/ports/contract-review-runner.port';

/**
 * Track B — AWS Bedrock AgentCore.
 *
 * CMA is NOT available on Bedrock; AgentCore has its own runtime + gateway
 * and reaches Claude via Bedrock. This adapter invokes an AgentCore runtime
 * (ARN in CONTRACT_REVIEW_AGENTCORE_RUNTIME_ARN) configured — on the AWS
 * side — with the SAME MCP server URL and the SAME playbook system prompt.
 * That shared MCP tool layer is the architectural through-line: one tool
 * layer, two runtimes.
 *
 * STUB until the AWS side is built (second sprint). The port + factory are
 * already wired, so flipping CONTRACT_REVIEW_RUNTIME=agentcore activates
 * this adapter with ZERO change to app code, the command, or the frontend.
 */
@Injectable()
export class AgentCoreRunner implements IContractReviewRunner {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async review(_input: ContractReviewInput): Promise<ContractReviewResult> {
    throw new Error(
      'AgentCore runtime not yet implemented (Track B). ' +
        'Set CONTRACT_REVIEW_RUNTIME=anthropic to use Managed Agents.',
    );
  }
}
