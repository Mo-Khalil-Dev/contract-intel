import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageShell } from './PageShell';

describe('PageShell', () => {
  it('renders children inside a <main>', () => {
    render(
      <PageShell>
        <p>Page content</p>
      </PageShell>,
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('renders an optional header outside <main>', () => {
    render(
      <PageShell header={<nav data-testid="hdr">Top Nav</nav>}>
        <p>Page content</p>
      </PageShell>,
    );

    const header = screen.getByTestId('hdr');
    const main = screen.getByRole('main');
    expect(header).toBeInTheDocument();
    expect(main).not.toContainElement(header);
  });

  it('applies xl max-width by default (1120px container)', () => {
    render(
      <PageShell>
        <p>Content</p>
      </PageShell>,
    );

    const main = screen.getByRole('main');
    expect(main.className).toContain('max-w-[1120px]');
  });

  it('applies md max-width when requested', () => {
    render(
      <PageShell maxWidth="md">
        <p>Content</p>
      </PageShell>,
    );

    const main = screen.getByRole('main');
    expect(main.className).toContain('max-w-3xl');
  });

  it('applies full width when requested', () => {
    render(
      <PageShell maxWidth="full">
        <p>Content</p>
      </PageShell>,
    );

    const main = screen.getByRole('main');
    expect(main.className).toContain('max-w-none');
  });

  it('uses min-h-screen on the outer container', () => {
    const { container } = render(
      <PageShell>
        <p>Content</p>
      </PageShell>,
    );

    expect((container.firstChild as HTMLElement).className).toContain('min-h-screen');
  });
});
