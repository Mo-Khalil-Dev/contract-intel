import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUpload } from '@/hooks/useUpload';
import { track } from '@/analytics';
import { UploadPage } from './UploadPage';

/**
 * Smart wrapper for the upload page. Owns the local UI state (selected
 * file, consent, validation error) and orchestrates the upload via
 * `useUpload`. On success, navigates to /processing/:documentId.
 */
export function UploadPageContainer() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { upload, cancel, isUploading, progress, error: uploadError, documentId } = useUpload();

  // Surface either a validation error (client-side, pre-upload) or an
  // upload error (from the mutation) — but not both at once.
  const error = validationError ?? uploadError?.message ?? null;

  // Navigate to the processing screen once the mock flow finishes.
  useEffect(() => {
    if (documentId) {
      navigate(`/processing/${documentId}`);
    }
  }, [documentId, navigate]);

  const userInitials = useMemo(() => {
    const source = user?.name?.trim() || user?.email || 'U';
    return source
      .split(/[\s@]/)
      .slice(0, 2)
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  }, [user]);

  function handleFileSelected(picked: File) {
    setValidationError(null);
    setFile(picked);
  }

  function handleValidationError(
    reason: 'file_too_large' | 'invalid_type',
    message: string,
  ) {
    setValidationError(message);
    track('upload_failed', { reason });
  }

  function handleFileRemoved() {
    setFile(null);
    setValidationError(null);
  }

  function handleSubmit() {
    if (!file || !consent || isUploading) return;
    track('upload_submitted', { file_size_bytes: file.size });
    upload(file);
  }

  function handleCancel() {
    if (isUploading) {
      cancel();
      return;
    }
    track('upload_cancelled');
    navigate('/');
  }

  function handleNav(id: string) {
    if (id === 'home') {
      navigate('/');
      return;
    }
    if (id === 'upload') {
      // Already here — clear any selection so the dropzone is fresh.
      handleFileRemoved();
      return;
    }
    // eslint-disable-next-line no-console
    console.info('[UploadPage] nav →', id);
  }

  return (
    <UploadPage
      file={file}
      consent={consent}
      isUploading={isUploading}
      progress={progress}
      error={error}
      userInitials={userInitials}
      onFileSelected={handleFileSelected}
      onFileRemoved={handleFileRemoved}
      onValidationError={handleValidationError}
      onConsentChange={setConsent}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onNav={handleNav}
    />
  );
}
