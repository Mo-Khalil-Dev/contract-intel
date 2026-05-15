import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useProcessingStatus,
  useRetryOcr,
} from '@/hooks/useProcessingStatus';
import { ProcessingPageView } from './ProcessingPage.view';

/**
 * Container — polls `/api/v1/documents/:id/processing-status`, auto-
 * redirects to `/results/:id` on completion, and surfaces the Retry CTA
 * on failure. View is presentation-only; Storybook covers all variants.
 */
export function ProcessingPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useProcessingStatus(documentId);
  const retry = useRetryOcr(documentId);

  // Auto-redirect to results once OCR is done. Brief delay lets the
  // success state render so the user sees the "Analysis ready" flash
  // rather than a jarring instant navigation.
  useEffect(() => {
    if (data?.status === 'ocr_complete' && documentId) {
      const t = setTimeout(() => navigate(`/results/${documentId}`), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [data?.status, documentId, navigate]);

  return (
    <ProcessingPageView
      documentId={documentId}
      status={data}
      isLoading={isLoading}
      isError={isError}
      isRetrying={retry.isLoading}
      onRetry={() => retry.mutate()}
      onUploadAnother={() => navigate('/upload')}
      onBackToDashboard={() => navigate('/')}
    />
  );
}
