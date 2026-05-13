import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypePill } from './TypePill';
import type { ContractType } from './useTypePill';

describe('TypePill', () => {
  const allTypes: ContractType[] = ['vendor', 'license', 'partnership', 'customer', 'lease', 'nda'];

  it('capitalises the type label', () => {
    render(<TypePill type="vendor" />);

    expect(screen.getByText('Vendor')).toBeInTheDocument();
  });

  it('renders all supported contract types', () => {
    allTypes.forEach((type) => {
      const { unmount } = render(<TypePill type={type} />);
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  it('applies a distinct colour scheme per type', () => {
    const colors = new Set<string>();

    allTypes.forEach((type) => {
      const { container, unmount } = render(<TypePill type={type} />);
      const pill = container.firstChild as HTMLElement;
      colors.add(pill.style.backgroundColor);
      unmount();
    });

    expect(colors.size).toBe(allTypes.length);
  });

  it('renders inline styles (text, bg, border)', () => {
    const { container } = render(<TypePill type="vendor" />);
    const pill = container.firstChild as HTMLElement;

    expect(pill.style.color).toBeTruthy();
    expect(pill.style.backgroundColor).toBeTruthy();
    expect(pill.style.borderColor).toBeTruthy();
  });
});
