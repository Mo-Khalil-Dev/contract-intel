import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { documentService } from '@/services/documentService';
import { track } from '@/analytics';
import type { DocumentId } from '@/types/documents';
import { UploadError } from '@/types/documents';

export interface UseUploadReturn {
  /** Kick off the upload flow with the chosen file. Safe to call once at a time. */
  upload: (file: File) => void;
  /** Abort the in-flight upload (if any) and reset state. */
  cancel: () => void;
  /** Reset to idle state — for "upload another" after success or failure. */
  reset: () => void;
  /** True while the mutation is running. */
  isUploading: boolean;
  /** 0..100. Reflects the storage PUT progress, not the whole flow. */
  progress: number;
  /** Set if any step threw an UploadError. */
  error: UploadError | null;
  /** Set on full success. Use this to navigate to /processing/:id. */
  documentId: DocumentId | null;
  /** Mirror of useMutation.isSuccess. */
  isSuccess: boolean;
}

/**
 * Orchestrates the 3-step upload flow:
 *   initiateUpload → uploadToStorage(with progress) → completeUpload.
 *
 * Fires analytics at each meaningful transition (started, completed, failed)
 * so the funnel is queryable in PostHog without per-component instrumentation.
 */
export function useUpload(): UseUploadReturn {
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef<number>(0);

  const mutation = useMutation<DocumentId, UploadError, File>({
    mutationFn: async (file: File) => {
      const controller = new AbortController();
      abortRef.current = controller;
      startedAtRef.current = performance.now();
      setProgress(0);

      const { uploadUrl, documentId } = await documentService.initiateUpload(file);
      track('upload_started', { document_id: documentId });

      await documentService.uploadToStorage(uploadUrl, file, {
        onProgress: setProgress,
        signal: controller.signal,
      });

      await documentService.completeUpload(documentId);

      track('upload_completed', {
        document_id: documentId,
        duration_ms: Math.round(performance.now() - startedAtRef.current),
      });

      return documentId;
    },
    onError: (err) => {
      track('upload_failed', { reason: err.reason });
    },
  });

  const upload = useCallback(
    (file: File) => {
      mutation.mutate(file);
    },
    [mutation],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    mutation.reset();
    setProgress(0);
    track('upload_cancelled');
  }, [mutation]);

  const reset = useCallback(() => {
    abortRef.current = null;
    mutation.reset();
    setProgress(0);
  }, [mutation]);

  // Abort any in-flight upload if the component unmounts (e.g. user
  // navigates away). Prevents zombie state updates + leaks.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    upload,
    cancel,
    reset,
    isUploading: mutation.isLoading,
    progress,
    error: mutation.error ?? null,
    documentId: mutation.data ?? null,
    isSuccess: mutation.isSuccess,
  };
}
