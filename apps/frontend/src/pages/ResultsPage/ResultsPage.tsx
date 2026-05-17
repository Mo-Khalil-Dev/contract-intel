import { useNavigate, useParams } from 'react-router-dom';
import { useClauses, useExtractionStatus } from '@/hooks/useClauses';
import { ResultsPageView } from './ResultsPage.view';

/**
 * Container — fetches per-document clauses + extraction-status snapshot
 * and threads them into the presentational view. Loading/error states
 * are handled inside the view so the breadcrumb stays visible at all
 * times.
 *
 * Export / Approve / Share are stubs in Phase 8 — wired up alongside
 * the real workflow integrations in Phase 11.
 */
export function ResultsPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const extractionQuery = useExtractionStatus(documentId);
  const clausesQuery = useClauses(documentId);

  return (
    <ResultsPageView
      documentId={documentId}
      clauses={clausesQuery.data ?? []}
      extraction={extractionQuery.data}
      isLoading={extractionQuery.isLoading || clausesQuery.isLoading}
      isError={extractionQuery.isError || clausesQuery.isError}
      onBackToContracts={() => navigate('/')}
      onExport={() => {
        // Phase 11 wires real PDF export. For now: no-op.
        console.warn('Export not yet wired up');
      }}
      onApprove={() => {
        console.warn('Approve not yet wired up');
      }}
      onShare={() => {
        console.warn('Share not yet wired up');
      }}
    />
  );
}
