import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PrecedentRow } from './PrecedentRow';
import { formatMetaLine, humaniseClauseType } from './usePrecedentRow';
import type { SimilarClauseDto } from '@/types/similarClauses';

const clause: SimilarClauseDto = {
  id: '3e300894-978f-464d-bc34-6cfd3acf8c73',
  type: 'limitation_of_liability',
  textSnippet: 'Aggregate liability capped at amounts paid in prior 12 months.',
  similarity: 0.94,
  document: {
    id: '4b34c764-0dff-49bf-b3f5-d04488ecf9c4',
    title: 'Globex MSA',
    uploadedAt: '2025-03-14T00:00:00.000Z',
  },
  pageNumber: 7,
  sectionRef: null,
};

describe('PrecedentRow', () => {
  it('renders the humanised clause type, snippet, and meta line', () => {
    render(<PrecedentRow clause={clause} onSelect={() => {}} />);

    expect(screen.getByText('Limitation of liability')).toBeInTheDocument();
    expect(
      screen.getByText('Aggregate liability capped at amounts paid in prior 12 months.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Globex MSA · /)).toBeInTheDocument();
  });

  it('renders the similarity bar with the right percentage', () => {
    render(<PrecedentRow clause={clause} onSelect={() => {}} />);
    expect(screen.getByText('94% match')).toBeInTheDocument();
  });

  it('invokes onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<PrecedentRow clause={clause} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('invokes onSelect on Enter and Space keypress', () => {
    const onSelect = vi.fn();
    render(<PrecedentRow clause={clause} onSelect={onSelect} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('marks the row aria-current when isActive', () => {
    render(<PrecedentRow clause={clause} isActive onSelect={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true');
  });

  it('omits aria-current when not active', () => {
    render(<PrecedentRow clause={clause} onSelect={() => {}} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
  });

  // ── Pure helpers ────────────────────────────────────────────────────

  describe('humaniseClauseType', () => {
    it('snake_case → Title-cased space form', () => {
      expect(humaniseClauseType('limitation_of_liability')).toBe(
        'Limitation of liability',
      );
      expect(humaniseClauseType('indemnification')).toBe('Indemnification');
    });
    it('handles empty input', () => {
      expect(humaniseClauseType('')).toBe('');
    });
  });

  describe('formatMetaLine', () => {
    it('appends formatted month/year to the title', () => {
      const out = formatMetaLine('Acme MSA', '2025-03-14T00:00:00.000Z');
      expect(out).toMatch(/^Acme MSA · [A-Z][a-z]{2} 2025$/);
    });
    it('falls back to just the title on invalid date', () => {
      expect(formatMetaLine('Acme MSA', 'not-a-date')).toBe('Acme MSA');
    });
  });
});
