import { AskPortfolioHandler } from './ask-portfolio.handler';
import { AskPortfolioCommand } from './ask-portfolio.command';
import { QueryHandlerRegistry } from '../handlers/query-handler.registry';
import { RiskAnalysisHandler } from '../handlers/risk-analysis.handler';
import { GeneralHandler } from '../handlers/general.handler';
import { ContextBuilder } from '../context/context-builder';
import { PortfolioContext } from '../context/portfolio-context';
import {
  AppendMessageInput,
  CreateThreadInput,
  IChatRepository,
  PersistedMessage,
} from '../../domain/chat.repository';
import {
  AnswerRequest,
  AnswerResult,
  IClaudeAnswerService,
} from '../ports/claude-answer.service';
import { AppError } from '../../../../shared/exceptions/app-error';

class InMemoryChatRepository implements IChatRepository {
  threads: CreateThreadInput[] = [];
  messages: AppendMessageInput[] = [];

  async createThread(input: CreateThreadInput): Promise<void> {
    this.threads.push(input);
  }
  async nextSequence(threadId: string): Promise<number> {
    return this.messages.filter((m) => m.threadId === threadId).length + 1;
  }
  async appendMessage(input: AppendMessageInput): Promise<PersistedMessage> {
    this.messages.push(input);
    return {
      id: input.id,
      threadId: input.threadId,
      role: input.role,
      content: input.content,
      sequence: input.sequence,
      createdAt: new Date(),
    };
  }
  async threadBelongsToUser(
    threadId: string,
    userId: string,
  ): Promise<boolean> {
    return this.threads.some(
      (t) => t.id === threadId && t.userId === userId,
    );
  }
}

const emptyContext = (q: string): PortfolioContext => ({
  queryType: 'risk-analysis',
  question: q,
  summary: {
    totalContracts: 1,
    analysed: 1,
    avgRisk: 8,
    criticalFlags: 2,
    unlimitedLiability: 1,
  },
  items: [
    {
      ref: 'doc:1',
      documentId: '1',
      title: 'Globex MSA',
      type: 'msa',
      counterparty: 'Globex',
      riskScore: 8,
      riskBand: 'high',
      flagsRed: 2,
      flagsOrange: 0,
      flagsBlue: 0,
      hasUnlimitedLiability: true,
      terminationDate: null,
    },
  ],
});

function buildRegistry(answer: IClaudeAnswerService): QueryHandlerRegistry {
  const contextBuilder = {
    build: async (_org: string, _type: string, q: string) => emptyContext(q),
  } as unknown as ContextBuilder;
  const risk = new RiskAnalysisHandler(contextBuilder, answer);
  const general = new GeneralHandler(contextBuilder, answer);
  return new QueryHandlerRegistry(risk, general);
}

describe('AskPortfolioHandler', () => {
  const command = new AskPortfolioCommand(
    'user-1',
    'user-1',
    'Which contracts have unlimited liability?',
  );

  it('answers, persists user + assistant messages, and returns a ranked result', async () => {
    const answerService: IClaudeAnswerService = {
      answer: async (_r: AnswerRequest): Promise<AnswerResult> => ({
        text: 'One contract has unlimited liability [1].',
      }),
    };
    const repo = new InMemoryChatRepository();
    const handler = new AskPortfolioHandler(
      buildRegistry(answerService),
      repo,
    );

    const result = await handler.execute(command);

    expect(result.queryType).toBe('risk-analysis');
    expect(result.format).toBe('ranked-list');
    expect(result.citations).toHaveLength(1);
    expect(repo.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(repo.threads).toHaveLength(1);
  });

  it('maps an LLM failure to a structured error and records a failed message', async () => {
    const answerService: IClaudeAnswerService = {
      answer: async () => {
        throw new Error('upstream 529');
      },
    };
    const repo = new InMemoryChatRepository();
    const handler = new AskPortfolioHandler(
      buildRegistry(answerService),
      repo,
    );

    await expect(handler.execute(command)).rejects.toBeInstanceOf(AppError);
    const assistant = repo.messages.find((m) => m.role === 'assistant');
    expect(assistant?.status).toBe('failed');
  });

  it('rejects an empty question', async () => {
    const answerService: IClaudeAnswerService = {
      answer: async () => ({ text: '' }),
    };
    const handler = new AskPortfolioHandler(
      buildRegistry(answerService),
      new InMemoryChatRepository(),
    );
    await expect(
      handler.execute(new AskPortfolioCommand('u', 'u', '   ')),
    ).rejects.toBeInstanceOf(AppError);
  });
});
