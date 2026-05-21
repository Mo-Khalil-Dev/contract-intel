import type { SimilarClauseDto } from '@/types/similarClauses';

export interface UsePrecedentRowProps {
  clause: SimilarClauseDto;
  isActive?: boolean;
  onSelect: () => void;
}

export interface UsePrecedentRowResult {
  similarity: number;
  displayPercent: number;
  /** True at >= 90% — drives the bold blue-dark percent label. */
  isStrong: boolean;
  type: string;
  textSnippet: string;
  contractName: string;
  contractDate: string;
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
 * Format an uploadedAt ISO timestamp as `Mon YYYY`. Defensive against
 * malformed input — returns empty string rather than 'Invalid Date'.
 */
export function formatContractDate(uploadedAtIso: string): string {
  const date = new Date(uploadedAtIso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export function usePrecedentRow({
  clause,
  isActive = false,
  onSelect,
}: UsePrecedentRowProps): UsePrecedentRowResult {
  const displayPercent = Math.round(clause.similarity * 100);
  return {
    similarity: clause.similarity,
    displayPercent,
    isStrong: displayPercent >= 90,
    type: humaniseClauseType(clause.type),
    textSnippet: clause.textSnippet,
    contractName: clause.document.title,
    contractDate: formatContractDate(clause.document.uploadedAt),
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
