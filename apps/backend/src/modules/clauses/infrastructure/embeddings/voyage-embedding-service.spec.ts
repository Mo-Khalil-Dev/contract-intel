import { VoyageAIClient, VoyageAIError, VoyageAITimeoutError } from 'voyageai';
import { VoyageEmbeddingService } from './voyage-embedding-service';
import {
  EmbeddingPermanentError,
  EmbeddingTransientError,
} from '../../application/errors/clause-extraction-errors';
import { EMBEDDING_DIM } from '../../domain/entities/clause';

function fakeClient(embedImpl: jest.Mock): VoyageAIClient {
  return { embed: embedImpl } as unknown as VoyageAIClient;
}

function fakeResponse(count: number, dim = EMBEDDING_DIM) {
  return {
    object: 'list',
    model: 'voyage-law-2',
    data: Array.from({ length: count }, (_, i) => ({
      embedding: new Array(dim).fill(0.1 + i * 0.001),
      index: i,
    })),
    usage: { totalTokens: count * 10 },
  };
}

function voyageError(statusCode: number, message = 'err') {
  return new VoyageAIError({ statusCode, message });
}

describe('VoyageEmbeddingService', () => {
  describe('happy path', () => {
    it('returns one EMBEDDING_DIM vector per input', async () => {
      const embed = jest.fn().mockResolvedValue(fakeResponse(3));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');

      const out = await svc.embedBatch(['a', 'b', 'c']);

      expect(out).toHaveLength(3);
      for (const r of out) expect(r.vector).toHaveLength(EMBEDDING_DIM);
      expect(embed).toHaveBeenCalledTimes(1);
    });

    it('sends inputType=document and the configured model', async () => {
      const embed = jest.fn().mockResolvedValue(fakeResponse(1));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');

      await svc.embedBatch(['x']);

      expect(embed).toHaveBeenCalledWith({
        input: ['x'],
        model: 'voyage-law-2',
        inputType: 'document',
      });
    });

    it('returns [] for empty input without calling the SDK', async () => {
      const embed = jest.fn();
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');
      const out = await svc.embedBatch([]);
      expect(out).toEqual([]);
      expect(embed).not.toHaveBeenCalled();
    });

    it('reports a stable model version', () => {
      const svc = new VoyageEmbeddingService(
        fakeClient(jest.fn()),
        'voyage-law-2',
      );
      expect(svc.getModelVersion()).toBe('voyage/voyage-law-2@2026-05');
    });
  });

  describe('batching', () => {
    it('keeps batches ≤128 as a single SDK call', async () => {
      const embed = jest.fn().mockResolvedValue(fakeResponse(128));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');

      const inputs = Array.from({ length: 128 }, (_, i) => `t${i}`);
      const out = await svc.embedBatch(inputs);

      expect(embed).toHaveBeenCalledTimes(1);
      expect(out).toHaveLength(128);
    });

    it('splits >128 across multiple SDK calls', async () => {
      const embed = jest
        .fn()
        .mockResolvedValueOnce(fakeResponse(128))
        .mockResolvedValueOnce(fakeResponse(50));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');

      const inputs = Array.from({ length: 178 }, (_, i) => `t${i}`);
      const out = await svc.embedBatch(inputs);

      expect(embed).toHaveBeenCalledTimes(2);
      expect(out).toHaveLength(178);
    });

    it('preserves order across batches', async () => {
      // Mark each vector with a deterministic value to verify ordering
      const tag = (count: number, base: number) => ({
        object: 'list',
        model: 'voyage-law-2',
        data: Array.from({ length: count }, (_, i) => ({
          embedding: new Array(EMBEDDING_DIM).fill(base + i),
          index: i,
        })),
        usage: { totalTokens: 0 },
      });
      const embed = jest
        .fn()
        .mockResolvedValueOnce(tag(128, 100))
        .mockResolvedValueOnce(tag(2, 200));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');

      const out = await svc.embedBatch(
        Array.from({ length: 130 }, (_, i) => `t${i}`),
      );

      expect(out[0].vector[0]).toBe(100);
      expect(out[127].vector[0]).toBe(227);
      expect(out[128].vector[0]).toBe(200);
      expect(out[129].vector[0]).toBe(201);
    });
  });

  describe('error mapping', () => {
    it('maps 429 → EmbeddingTransientError', async () => {
      const embed = jest.fn().mockRejectedValue(voyageError(429, 'rate limit'));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');
      await expect(svc.embedBatch(['x'])).rejects.toBeInstanceOf(
        EmbeddingTransientError,
      );
    });

    it.each([500, 502, 503])(
      'maps %i → EmbeddingTransientError',
      async (status) => {
        const embed = jest.fn().mockRejectedValue(voyageError(status, 'server'));
        const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');
        await expect(svc.embedBatch(['x'])).rejects.toBeInstanceOf(
          EmbeddingTransientError,
        );
      },
    );

    it('maps timeout → EmbeddingTransientError', async () => {
      const embed = jest
        .fn()
        .mockRejectedValue(new VoyageAITimeoutError('timeout'));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');
      await expect(svc.embedBatch(['x'])).rejects.toBeInstanceOf(
        EmbeddingTransientError,
      );
    });

    it('maps connection errors → EmbeddingTransientError', async () => {
      const embed = jest.fn().mockRejectedValue(new Error('fetch failed: ENOTFOUND'));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');
      await expect(svc.embedBatch(['x'])).rejects.toBeInstanceOf(
        EmbeddingTransientError,
      );
    });

    it('maps 401 → EmbeddingPermanentError("unauthorized")', async () => {
      const embed = jest.fn().mockRejectedValue(voyageError(401, 'bad key'));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');
      const err = await svc.embedBatch(['x']).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(EmbeddingPermanentError);
      expect((err as EmbeddingPermanentError).reason).toBe('unauthorized');
    });

    it('maps 400 → EmbeddingPermanentError("invalid_request")', async () => {
      const embed = jest.fn().mockRejectedValue(voyageError(400, 'bad input'));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');
      const err = await svc.embedBatch(['x']).catch((e: unknown) => e);
      expect((err as EmbeddingPermanentError).reason).toBe('invalid_request');
    });

    it('maps unknown error → EmbeddingPermanentError("internal_error")', async () => {
      const embed = jest.fn().mockRejectedValue(new Error('boom'));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');
      const err = await svc.embedBatch(['x']).catch((e: unknown) => e);
      expect((err as EmbeddingPermanentError).reason).toBe('internal_error');
    });

    it('detects dimension mismatch (defensive against model swap)', async () => {
      const embed = jest.fn().mockResolvedValue(fakeResponse(1, 512));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');
      const err = await svc.embedBatch(['x']).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(EmbeddingPermanentError);
      expect((err as EmbeddingPermanentError).reason).toBe('dimension_mismatch');
    });

    it('detects response/input length mismatch', async () => {
      const embed = jest.fn().mockResolvedValue(fakeResponse(1));
      const svc = new VoyageEmbeddingService(fakeClient(embed), 'voyage-law-2');
      const err = await svc.embedBatch(['x', 'y']).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(EmbeddingPermanentError);
      expect((err as EmbeddingPermanentError).reason).toBe('corrupt_response');
    });
  });
});
