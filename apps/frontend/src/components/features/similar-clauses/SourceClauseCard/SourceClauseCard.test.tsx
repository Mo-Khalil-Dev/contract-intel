import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SourceClauseCard } from './SourceClauseCard';

describe('SourceClauseCard', () => {
  const props = {
    type: 'limitation_of_liability',
    textSnippet: 'Liability shall not exceed twelve months fees.',
  };

  it('renders the humanised type, the SOURCE eyebrow, and the snippet', () => {
    render(<SourceClauseCard {...props} />);
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Limitation of liability')).toBeInTheDocument();
    expect(
      screen.getByText(/Liability shall not exceed twelve months fees\./),
    ).toBeInTheDocument();
  });

  it('renders the meta line when contractName and sectionRef are provided', () => {
    render(
      <SourceClauseCard {...props} contractName="Acme MSA" sectionRef="9.2" />,
    );
    expect(screen.getByText('Acme MSA · §9.2')).toBeInTheDocument();
  });

  it('omits the meta line when neither contractName nor sectionRef provided', () => {
    const { container } = render(<SourceClauseCard {...props} />);
    expect(container.textContent).not.toContain('§');
  });

  it('renders as a static div when no onClick is provided', () => {
    const { container } = render(<SourceClauseCard {...props} />);
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders as an interactive button when onClick is provided', () => {
    const onClick = vi.fn();
    render(<SourceClauseCard {...props} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the snippet with Georgia italic style', () => {
    const { container } = render(<SourceClauseCard {...props} />);
    const snippet = container.querySelector('p[style*="Georgia"]');
    expect(snippet).toBeTruthy();
    expect(snippet?.getAttribute('style')).toMatch(/font-style: italic/);
  });
});
