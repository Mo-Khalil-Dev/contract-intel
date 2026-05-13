import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrgBanner } from './OrgBanner';

describe('OrgBanner', () => {
  it('renders the org name', () => {
    render(<OrgBanner orgName="Northwind Holdings Ltd" />);

    expect(screen.getByText('Northwind Holdings Ltd')).toBeInTheDocument();
  });

  it('renders the workspace tag when provided', () => {
    render(<OrgBanner orgName="Northwind" workspaceTag="Legal Operations" />);

    expect(screen.getByText('Legal Operations')).toBeInTheDocument();
  });

  it('omits workspace tag when not provided', () => {
    render(<OrgBanner orgName="Northwind" />);

    expect(screen.queryByText('·')).not.toBeInTheDocument();
  });

  it('defaults to operational status', () => {
    render(<OrgBanner orgName="Northwind" />);

    expect(screen.getByText('All systems operational')).toBeInTheDocument();
  });

  it('shows degraded status', () => {
    render(<OrgBanner orgName="Northwind" status="degraded" />);

    expect(screen.getByText('Degraded performance')).toBeInTheDocument();
  });

  it('shows outage status', () => {
    render(<OrgBanner orgName="Northwind" status="outage" />);

    expect(screen.getByText('Service outage')).toBeInTheDocument();
  });

  it('applies green dot for operational status', () => {
    const { container } = render(<OrgBanner orgName="Northwind" />);

    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(dot.style.backgroundColor).toBe('rgb(16, 185, 129)'); // green
  });

  it('applies red dot for outage status', () => {
    const { container } = render(<OrgBanner orgName="Northwind" status="outage" />);

    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(dot.style.backgroundColor).toBe('rgb(239, 68, 68)'); // red
  });
});
