import { AnswerRequest } from '../ports/claude-answer.service';
import { PortfolioContext } from '../context/portfolio-context';

/**
 * Turns a {@link PortfolioContext} into a system + user prompt pair
 * (Phase 12, Task 12.2).
 *
 * Two hard rules are baked into the system prompt because the whole
 * feature's trustworthiness rests on them:
 *   1. Answer ONLY from the provided context — never invent contracts.
 *   2. Cite every factual claim with the bracketed [n] index of the
 *      contract it came from, so the CitationExtractor can validate it.
 *
 * The numbering the model sees ([1], [2], …) is positional over
 * `context.items`; the extractor maps those indices back to refs.
 */

const SYSTEM_PROMPT = [
  'You are ContractIntel, an assistant that answers questions about a',
  "user's own contract portfolio.",
  '',
  'Rules:',
  '- Use ONLY the CONTRACTS and PORTFOLIO SUMMARY provided in the user',
  '  message. Never invent contracts, numbers, or clauses.',
  '- Cite every factual claim with the bracketed index of the contract it',
  '  comes from, e.g. "Two agreements have unlimited liability [1][3]."',
  '- If the provided context does not contain the answer, say so plainly',
  '  rather than guessing.',
  '- Be concise and direct. Lead with the answer.',
].join('\n');

export function buildPrompt(context: PortfolioContext): AnswerRequest {
  const lines: string[] = [];

  lines.push(`QUESTION: ${context.question}`);
  lines.push('');
  lines.push('PORTFOLIO SUMMARY:');
  lines.push(`- Total contracts: ${context.summary.totalContracts}`);
  lines.push(`- Analysed: ${context.summary.analysed}`);
  lines.push(`- Average risk (0-10): ${context.summary.avgRisk}`);
  lines.push(`- Critical (red) flags: ${context.summary.criticalFlags}`);
  lines.push(
    `- Contracts with unlimited liability: ${context.summary.unlimitedLiability}`,
  );
  lines.push('');
  lines.push('CONTRACTS:');

  context.items.forEach((item, i) => {
    const n = i + 1;
    const risk =
      item.riskScore === null
        ? 'unknown'
        : `${item.riskScore} (${item.riskBand})`;
    lines.push(
      `[${n}] ${item.title} — type: ${item.type}; counterparty: ${
        item.counterparty || 'unknown'
      }; risk: ${risk}; red flags: ${item.flagsRed}; unlimited liability: ${
        item.hasUnlimitedLiability ? 'yes' : 'no'
      }; termination: ${item.terminationDate ?? 'n/a'}`,
    );
  });

  if (context.items.length === 0) {
    lines.push('(no contracts in scope)');
  }

  return { system: SYSTEM_PROMPT, user: lines.join('\n') };
}
