import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as icons from './icons';

describe('icons module', () => {
  it('re-exports the curated icon set', () => {
    const expected = [
      'AlertIcon',
      'ArrowRightIcon',
      'CheckIcon',
      'CheckCircleIcon',
      'ChevronDownIcon',
      'ChevronRightIcon',
      'InfoIcon',
      'DownloadIcon',
      'ExternalLinkIcon',
      'EyeIcon',
      'FileIcon',
      'FilterIcon',
      'LogoutIcon',
      'MenuIcon',
      'MoreIcon',
      'EditIcon',
      'PlusIcon',
      'SearchIcon',
      'SettingsIcon',
      'TrashIcon',
      'UploadIcon',
      'UserIcon',
      'CloseIcon',
    ];

    expected.forEach((name) => {
      expect(icons).toHaveProperty(name);
    });
  });

  it('renders icons as valid svg elements', () => {
    const { container } = render(<icons.UploadIcon />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<icons.UploadIcon className="text-blue h-4 w-4" />);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('text-blue');
    expect(svg?.getAttribute('class')).toContain('h-4');
  });

  it('uses currentColor for stroke', () => {
    const { container } = render(<icons.CheckIcon />);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });
});
