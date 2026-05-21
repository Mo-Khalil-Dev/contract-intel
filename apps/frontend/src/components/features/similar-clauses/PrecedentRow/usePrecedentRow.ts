import type { SimilarClauseDto } from '@/types/similarClauses';

export interface UsePrecedentRowProps {
  clause: SimilarClauseDto;
  isActive?: boolean;
  onSelect: () => void;
}

export interface UsePrecedentRowResult {
  similarity: number;
  type: string;
  textSnippet: string;
  metaLine: string;
  isActive: boolean;
  handleClick: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Format human-readable types: 'limitation_of_liability' →
 * 'Limitation of liability'. We keep clause type as a snake_case
 * enum on the wire and humanise once, here.
 */
export function humaniseClauseType(type: string): string {
  if (!type) return '';
  const lower = type.replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Format a meta line: `{document title} · {Mon YYYY}`.
 * Date is rendered in the user's locale; for the demo dataset that's
 * en-US, but the formatter respects browser locale.
 */
export function formatMetaLine(title: string, uploadedAtIso: string): string {
  const date = new Date(uploadedAtIso);
  const month = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  return month ? `${title} · ${month}` : title;
}

export function usePrecedentRow({
  clause,
  isActive = false,
  onSelect,
}: UsePrecedentRowProps): UsePrecedentRowResult {
  return {
    similarity: clause.similarity,
    type: humaniseClauseType(clause.type),
    textSnippet: clause.textSnippet,
    metaLine: formatMetaLine(clause.document.title, clause.document.uploadedAt),
    isActive,
    handleClick: onSelect,
    handleKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect();
      }
    },
  };
}
