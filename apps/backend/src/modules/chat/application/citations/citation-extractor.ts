import { PortfolioContext } from '../context/portfolio-context';

/**
 * A validated source reference attached to an answer. Only citations that
 * map to a real context item survive — grounding over recall (Task 12.2).
 */
export interface Citation {
  /** 1-based marker as it appears in the prose, e.g. 1 for "[1]". */
  index: number;
  ref: string;
  documentId: string;
  title: string;
}

/**
 * Parses bracketed [n] markers out of the model's prose and validates
 * each against the context items the prompt was built from. Markers that
 * point outside the context range are dropped (the model hallucinated a
 * reference); duplicates collapse to one citation per index.
 *
 * Returns citations sorted by index so the UI footer lists sources in the
 * order they first appear.
 */
export function extractCitations(
  answerText: string,
  context: PortfolioContext,
): Citation[] {
  const found = new Set<number>();
  const regex = /\[(\d+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(answerText)) !== null) {
    found.add(Number(match[1]));
  }

  const citations: Citation[] = [];
  for (const index of found) {
    const item = context.items[index - 1];
    if (!item) continue; // unbacked reference — drop it.
    citations.push({
      index,
      ref: item.ref,
      documentId: item.documentId,
      title: item.title,
    });
  }

  return citations.sort((a, b) => a.index - b.index);
}
