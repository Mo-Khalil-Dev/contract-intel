import type { Meta, StoryObj } from '@storybook/react-vite';
import { UploadPage } from './UploadPage';

// Mock a File without producing real bytes — Storybook just renders the
// presentational page and only inspects { name, size }.
function mockFile(name: string, sizeBytes: number): File {
  const f = new File([new Blob([new Uint8Array(0)])], name, { type: 'application/pdf' });
  Object.defineProperty(f, 'size', { value: sizeBytes });
  return f;
}

const noop = () => {};

const baseArgs = {
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

const meta: Meta<typeof UploadPage> = {
  title: 'Pages/UploadPage',
  component: UploadPage,
  parameters: { layout: 'fullscreen', backgrounds: { default: 'light' } },
  args: baseArgs,
};
export default meta;
type Story = StoryObj<typeof UploadPage>;

/** Empty initial state — no file picked, consent unchecked. */
export const Empty: Story = { args: baseArgs };

/** A small PDF is selected but consent is not yet ticked. */
export const FileSelected: Story = {
  args: { ...baseArgs, file: mockFile('acme-vendor-agreement.pdf', 1.4 * 1024 * 1024) },
};

/** File picked AND consent ticked — submit button is enabled. */
export const ReadyToSubmit: Story = {
  args: {
    ...baseArgs,
    file: mockFile('acme-vendor-agreement.pdf', 1.4 * 1024 * 1024),
    consent: true,
  },
};

/** Upload mid-flight at 25% — progress bar visible, controls disabled. */
export const Uploading25: Story = {
  args: {
    ...baseArgs,
    file: mockFile('acme-vendor-agreement.pdf', 12.3 * 1024 * 1024),
    consent: true,
    isUploading: true,
    progress: 25,
  },
};

/** Upload mid-flight at 75%. */
export const Uploading75: Story = {
  args: {
    ...baseArgs,
    file: mockFile('acme-vendor-agreement.pdf', 12.3 * 1024 * 1024),
    consent: true,
    isUploading: true,
    progress: 75,
  },
};

/** File picker rejected — file too large (>50 MB). */
export const ErrorFileTooLarge: Story = {
  args: {
    ...baseArgs,
    error: 'File is larger than 50 MB.',
  },
};

/** File picker rejected — wrong type. */
export const ErrorInvalidType: Story = {
  args: {
    ...baseArgs,
    error: 'Only PDF files are accepted.',
  },
};

/** Upload failed mid-flight — file still selected so user can retry. */
export const ErrorNetwork: Story = {
  args: {
    ...baseArgs,
    file: mockFile('acme-vendor-agreement.pdf', 4.7 * 1024 * 1024),
    consent: true,
    error: 'Network connection lost during upload.',
  },
};

/** Backend rejected the upload at the complete step. */
export const ErrorBackend: Story = {
  args: {
    ...baseArgs,
    file: mockFile('acme-vendor-agreement.pdf', 4.7 * 1024 * 1024),
    consent: true,
    error: 'Backend rejected the upload.',
  },
};

/** Long filename — verifies ellipsis truncation in the file card. */
export const LongFilename: Story = {
  args: {
    ...baseArgs,
    file: mockFile(
      'A-Very-Long-Vendor-Agreement-With-Multiple-Amendments-And-Schedules-V12-Final-Signed.pdf',
      8 * 1024 * 1024,
    ),
    consent: true,
  },
};
