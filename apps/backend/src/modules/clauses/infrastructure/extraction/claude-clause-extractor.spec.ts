import Anthropic from '@anthropic-ai/sdk';
import { ClaudeClauseExtractor } from './claude-clause-extractor';
import {
  ExtractionPermanentError,
  ExtractionTransientError,
} from '../../application/errors/clause-extraction-errors';
import {
  CHUNK_THRESHOLD_CHARS,
  EXTRACT_CLAUSES_TOOL,
} from './claude-prompt';
import type { ExtractInput } from '../../application/ports/clause-extractor.port';

function emptyMetadataRaw() {
  return {
    contractType: null,
    parties: [],
    effectiveDate: null,
    terminationDate: null,
    noticePeriod: null,
    autoRenewal: null,
    paymentAmount: null,
    currency: null,
    paymentSchedule: null,
    priceEscalation: null,
    paymentTerms: null,
  };
}

function toolUseResponse(
  clauses: Record<string, unknown>[],
  metadata: Record<string, unknown> = emptyMetadataRaw(),
): Anthropic.Messages.Message {
  return {
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-4-7',
    stop_reason: 'tool_use',
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 50 } as Anthropic.Messages.Usage,
    content: [
      {
        type: 'tool_use',
        id: 'tool_1',
        name: EXTRACT_CLAUSES_TOOL.name,
        input: { clauses, metadata },
      },
    ],
  } as Anthropic.Messages.Message;
}

function validClause(overrides: Record<string, unknown> = {}) {
  return {
    clientRef: 'c1',
    parentClientRef: null,
    type: 'indemnification',
    confidence: 0.9,
    text: 'Indemnification text.',
    riskScore: 50,
    riskLevel: 'medium',
    riskFlags: [],
    riskExplanation: 'standard',
    ...overrides,
  };
}

function fakeClient(impl: jest.Mock): Anthropic {
  // The extractor uses `messages.stream(params).finalMessage()` rather
  // than `messages.create(params)` to bypass the SDK's 10-minute
  // synchronous-call guard at high max_tokens. The mock surface mirrors
  // that: `stream(params)` returns an object whose `finalMessage()`
  // delegates to the spec's `impl(params)` — so every existing
  // `impl.mockResolvedValue(toolUseResponse(...))` call still drives
  // the right code path, and assertions on `impl.mock.calls` still
  // inspect the same params.
  return {
    messages: {
      stream: (params: unknown) => ({
        finalMessage: () => Promise.resolve(impl(params)),
      }),
    },
  } as unknown as Anthropic;
}

function input(text: string, pages?: ExtractInput['pages']): ExtractInput {
  return {
    documentId: 'doc-1',
    text,
    pages: pages ?? [{ pageNumber: 1, startOffset: 0, endOffset: text.length }],
    language: 'en',
  };
}

describe('ClaudeClauseExtractor', () => {
  describe('happy path', () => {
    it('returns mapped clauses from a single call', async () => {
      const create = jest
        .fn()
        .mockResolvedValue(toolUseResponse([validClause()]));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');

      const out = await ext.extract(input('Indemnification text.'));

      expect(out.clauses).toHaveLength(1);
      expect(out.clauses[0].clientRef).toBe('c1');
      expect(create).toHaveBeenCalledTimes(1);
    });

    it('sends the system prompt with cache_control: ephemeral', async () => {
      const create = jest
        .fn()
        .mockResolvedValue(toolUseResponse([validClause()]));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');

      await ext.extract(input('Indemnification text.'));

      const call = create.mock.calls[0][0];
      expect(Array.isArray(call.system)).toBe(true);
      expect(call.system[0].cache_control).toEqual({ type: 'ephemeral' });
      expect(call.tool_choice).toEqual({
        type: 'tool',
        name: EXTRACT_CLAUSES_TOOL.name,
      });
    });

    it('reports a stable model version', () => {
      const ext = new ClaudeClauseExtractor(
        fakeClient(jest.fn()),
        'claude-opus-4-7',
      );
      expect(ext.getModelVersion()).toBe('anthropic/claude-opus-4-7@2026-05');
    });
  });

  describe('error mapping', () => {
    function apiError(status: number, message = 'err', type?: string) {
      return new Anthropic.APIError(
        status,
        type ? { error: { type, message } } : { message },
        message,
        new Headers(),
      );
    }

    it('maps 429 → ExtractionTransientError', async () => {
      const create = jest.fn().mockRejectedValue(apiError(429, 'rate limit'));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');
      await expect(ext.extract(input('x'))).rejects.toBeInstanceOf(
        ExtractionTransientError,
      );
    });

    it('maps 503 → ExtractionTransientError', async () => {
      const create = jest.fn().mockRejectedValue(apiError(503, 'overloaded'));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');
      await expect(ext.extract(input('x'))).rejects.toBeInstanceOf(
        ExtractionTransientError,
      );
    });

    it('maps overloaded_error type → ExtractionTransientError', async () => {
      const create = jest
        .fn()
        .mockRejectedValue(apiError(500, 'overloaded', 'overloaded_error'));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');
      await expect(ext.extract(input('x'))).rejects.toBeInstanceOf(
        ExtractionTransientError,
      );
    });

    it('maps 400 context-overflow → ExtractionPermanentError("context_overflow")', async () => {
      const create = jest
        .fn()
        .mockRejectedValue(apiError(400, 'input is too long for context window'));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');
      const err = await ext.extract(input('x')).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ExtractionPermanentError);
      expect((err as ExtractionPermanentError).reason).toBe('context_overflow');
    });

    it('maps 401 → ExtractionPermanentError("unauthorized")', async () => {
      const create = jest.fn().mockRejectedValue(apiError(401, 'bad key'));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');
      const err = await ext.extract(input('x')).catch((e: unknown) => e);
      expect((err as ExtractionPermanentError).reason).toBe('unauthorized');
    });

    it('maps 400 generic → ExtractionPermanentError("invalid_request")', async () => {
      const create = jest.fn().mockRejectedValue(apiError(400, 'bad request'));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');
      const err = await ext.extract(input('x')).catch((e: unknown) => e);
      expect((err as ExtractionPermanentError).reason).toBe('invalid_request');
    });

    it('maps unknown error → ExtractionPermanentError("internal_error")', async () => {
      const create = jest.fn().mockRejectedValue(new Error('boom'));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');
      const err = await ext.extract(input('x')).catch((e: unknown) => e);
      expect((err as ExtractionPermanentError).reason).toBe('internal_error');
    });
  });

  describe('chunking', () => {
    it('keeps small documents as a single chunk', async () => {
      const create = jest
        .fn()
        .mockResolvedValue(toolUseResponse([validClause()]));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');

      await ext.extract(input('short text'));

      expect(create).toHaveBeenCalledTimes(1);
    });

    it('splits over the threshold by page boundaries and namespaces clientRefs', async () => {
      const pageA = 'A'.repeat(CHUNK_THRESHOLD_CHARS - 100);
      const pageB = 'B'.repeat(2000); // forces a second chunk
      const text = pageA + pageB;
      const pages = [
        { pageNumber: 1, startOffset: 0, endOffset: pageA.length },
        { pageNumber: 2, startOffset: pageA.length, endOffset: text.length },
      ];

      const create = jest
        .fn()
        .mockResolvedValueOnce(toolUseResponse([validClause({ clientRef: 'c1' })]))
        .mockResolvedValueOnce(toolUseResponse([validClause({ clientRef: 'c1' })]));
      const ext = new ClaudeClauseExtractor(fakeClient(create), 'claude-opus-4-7');

      const out = await ext.extract(input(text, pages));

      expect(create).toHaveBeenCalledTimes(2);
      expect(out.clauses).toHaveLength(2);
      // Each chunk's clientRef is namespaced so the handler's parent
      // resolver doesn't conflate them.
      expect(out.clauses.map((c) => c.clientRef).sort()).toEqual([
        'chunk0:c1',
        'chunk1:c1',
      ]);
    });
  });
});
