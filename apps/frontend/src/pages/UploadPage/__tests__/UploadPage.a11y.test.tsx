import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { UploadPage } from '../UploadPage';

expect.extend(toHaveNoViolations);

function mockFile(name = 'demo.pdf', size = 1024 * 1024): File {
  const f = new File([new Blob([new Uint8Array(0)])], name, { type: 'application/pdf' });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

const noop = () => {};

const baseProps = {
  file: null,
  consent: false,
  isUploading: false,
  progress: 0,
  error: null,
  userInitials: 'SJ',
  onFileSelected: noop,
  onFileRemoved: noop,
  onValidationError: noop,
  onConsentChange: noop,
  onSubmit: noop,
  onCancel: noop,
  onNav: noop,
};

describe('UploadPage — Accessibility', () => {
  it('idle state has no axe violations', async () => {
    const { container } = render(<UploadPage {...baseProps} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('file-selected state has no axe violations', async () => {
    const { container } = render(<UploadPage {...baseProps} file={mockFile()} consent />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('uploading state has no axe violations', async () => {
    const { container } = render(
      <UploadPage
        {...baseProps}
        file={mockFile()}
        consent
        isUploading
        progress={42}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('error state has no axe violations', async () => {
    const { container } = render(
      <UploadPage
        {...baseProps}
        file={mockFile()}
        consent
        error="Network connection lost during upload."
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders an h1 (heading hierarchy)', () => {
    const { getByRole } = render(<UploadPage {...baseProps} />);
    expect(getByRole('heading', { level: 1 })).toHaveTextContent('Upload a contract');
  });

  it('dropzone is keyboard-reachable and labelled', () => {
    const { getByRole } = render(<UploadPage {...baseProps} />);
    const zone = getByRole('button', { name: /upload a pdf file/i });
    expect(zone).toBeInTheDocument();
    expect(zone).toHaveAttribute('tabindex', '0');
  });

  it('exposes an aria-live progressbar while uploading', () => {
    const { getByRole } = render(
      <UploadPage
        {...baseProps}
        file={mockFile()}
        consent
        isUploading
        progress={60}
      />,
    );
    const bar = getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('error message is announced via role=alert', () => {
    const { getByRole } = render(
      <UploadPage
        {...baseProps}
        file={mockFile()}
        consent
        error="Network connection lost during upload."
      />,
    );
    const alert = getByRole('alert');
    expect(alert).toHaveTextContent(/network connection/i);
  });

  it('submit button has aria-describedby when disabled with a reason', () => {
    const { getByRole } = render(<UploadPage {...baseProps} />);
    const btn = getByRole('button', { name: /analyze contract/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-describedby', 'submit-hint');
  });
});
