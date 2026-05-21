import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyPrecedentState } from './EmptyPrecedentState';

describe('EmptyPrecedentState', () => {
  it('renders the headline', () => {
    render(<EmptyPrecedentState />);
    expect(
      screen.getByRole('heading', { name: /No similar clauses found yet/i }),
    ).toBeInTheDocument();
  });

  it('renders generic copy when no clauseType is provided', () => {
    render(<EmptyPrecedentState />);
    expect(
      screen.getByText(/We couldn't find clauses similar enough/i),
    ).toBeInTheDocument();
  });

  it('humanises clauseType into the explanation copy', () => {
    const { container } = render(
      <EmptyPrecedentState clauseType="limitation_of_liability" />,
    );
    // The humanised type is wrapped in a <strong> so the text is split
    // across nodes; assert on the container's collapsed text instead.
    expect(container.textContent).toMatch(
      /This is the first Limitation of liability clause/i,
    );
  });
});
