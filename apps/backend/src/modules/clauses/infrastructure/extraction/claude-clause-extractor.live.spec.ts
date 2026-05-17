import Anthropic from '@anthropic-ai/sdk';
import { ClaudeClauseExtractor } from './claude-clause-extractor';
import { ClauseTypeValue } from '../../domain/value-objects/clause-type.vo';

/**
 * Live integration test against the real Anthropic API.
 *
 * Gated by env: only runs when CLAUSE_EXTRACTOR_LIVE_TEST=1 AND
 * CLAUDE_API_KEY is set. Default CI does NOT pay $ for these.
 *
 * Cost: ~$0.05–0.20 per run on Opus 4.7 with the fixture below
 * (~400 input chars + system prompt + tool schema, ~500–1000 output
 * tokens depending on how many clauses Claude returns).
 *
 * What we assert:
 *   - The call succeeds
 *   - At least one clause is returned
 *   - Every returned clause has a valid type from the 15-value taxonomy
 *   - Confidence is in [0, 1]
 *   - Each clause's text is verbatim findable in the input (no
 *     hallucination)
 *
 * We deliberately don't assert specific clause counts — Claude's output
 * varies. The structural guarantees above are what the handler relies on.
 */


const SAMPLE_CONTRACT = `
SERVICE AGREEMENT

1. Indemnification. Vendor shall defend, indemnify, and hold harmless
Customer from any third-party claim arising out of Vendor's breach of
this Agreement or Vendor's gross negligence or willful misconduct.

2. Limitation of Liability. Except for breaches of confidentiality or
indemnification obligations, each party's aggregate liability under this
Agreement shall not exceed the fees paid by Customer in the twelve (12)
months preceding the claim.

3. Termination. Either party may terminate this Agreement for material
breach upon thirty (30) days' prior written notice if the breach remains
uncured.

4. Governing Law. This Agreement shall be governed by the laws of the
State of Delaware, without regard to its conflicts of law principles.

5. Payment Terms. Customer shall pay all undisputed invoices within
thirty (30) days of receipt.
`.trim();

const SHOULD_RUN =
  process.env.CLAUSE_EXTRACTOR_LIVE_TEST === '1' && !!process.env.CLAUDE_API_KEY;

const itOrSkip = SHOULD_RUN ? it : it.skip;

describe('ClaudeClauseExtractor (live)', () => {
  itOrSkip(
    'extracts clauses from a real contract',
    async () => {
      const model = process.env.CLAUDE_MODEL ?? 'claude-opus-4-7';
      const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
      const extractor = new ClaudeClauseExtractor(client, model);

      const out = await extractor.extract({
        documentId: 'live-fixture-1',
        text: SAMPLE_CONTRACT,
        pages: [
          {
            pageNumber: 1,
            startOffset: 0,
            endOffset: SAMPLE_CONTRACT.length,
          },
        ],
        language: 'en',
      });

      // eslint-disable-next-line no-console
      console.log(
        `[live test] received ${out.clauses.length} clauses from ${model}:`,
        out.clauses.map((c) => ({
          type: c.type,
          conf: c.confidence,
          riskLevel: c.riskLevel,
        })),
      );
      // eslint-disable-next-line no-console
      console.log(`[live test] metadata:`, out.metadata);

      expect(out.clauses.length).toBeGreaterThan(0);

      const allowedTypes = Object.values(ClauseTypeValue) as string[];
      for (const c of out.clauses) {
        expect(allowedTypes).toContain(c.type);
        expect(c.confidence).toBeGreaterThanOrEqual(0);
        expect(c.confidence).toBeLessThanOrEqual(1);
        expect(SAMPLE_CONTRACT.indexOf(c.text)).toBeGreaterThanOrEqual(0);
        expect(c.riskScore).toBeGreaterThanOrEqual(0);
        expect(c.riskScore).toBeLessThanOrEqual(100);
      }

      // Metadata structural assertions — exact values vary by model run.
      expect(Array.isArray(out.metadata.parties)).toBe(true);
    },
    60_000, // generous timeout; Opus can take 10–30s on a small contract
  );
});
