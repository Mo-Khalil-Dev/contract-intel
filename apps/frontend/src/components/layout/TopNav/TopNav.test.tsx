import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TopNav } from './TopNav';
import type { NavLink } from './useTopNav';

const links: NavLink[] = [
  { href: '/', label: 'Home', current: true },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/renewals', label: 'Renewals' },
];

describe('TopNav', () => {
  it('renders the brand', () => {
    render(<TopNav links={links} />);

    expect(screen.getByText('ContractIntel')).toBeInTheDocument();
  });

  it('renders each link', () => {
    render(<TopNav links={links} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Renewals')).toBeInTheDocument();
  });

  it('marks the current link with aria-current', () => {
    render(<TopNav links={links} />);

    expect(screen.getByText('Home').closest('a')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Portfolio').closest('a')).not.toHaveAttribute('aria-current');
  });

  it('uses a <nav> with aria-label', () => {
    render(<TopNav links={links} />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });

  it('omits the user menu when user is not provided', () => {
    render(<TopNav links={links} />);

    expect(screen.queryByLabelText('User menu')).not.toBeInTheDocument();
  });

  it('renders the user menu trigger when user is provided', () => {
    render(<TopNav links={links} user={{ name: 'Alice Smith', email: 'alice@example.com' }} />);

    expect(screen.getByLabelText('User menu')).toBeInTheDocument();
  });

  it('shows initials when avatar URL is not provided', () => {
    render(<TopNav links={links} user={{ name: 'Alice Smith', email: 'alice@example.com' }} />);

    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('shows two-letter initials from first and last word', () => {
    render(<TopNav links={links} user={{ name: 'Mo Khalil', email: 'mo@example.com' }} />);

    expect(screen.getByText('MK')).toBeInTheDocument();
  });

  it('handles single-word names gracefully', () => {
    render(<TopNav links={links} user={{ name: 'Cher', email: 'cher@example.com' }} />);

    expect(screen.getByText('C')).toBeInTheDocument();
  });
});
