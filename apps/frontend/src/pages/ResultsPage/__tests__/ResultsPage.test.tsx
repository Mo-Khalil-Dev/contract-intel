import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsPageView } from '../ResultsPage.view';
import type {
  ClauseResponse,
  ContractMetadata,
  ExtractionStatusResponse,
} from '@/types/clauses';

const documentId = 'b47a490b-fb31-4031-b740-82f8d568dd18' as ClauseResponse['documentId'];
const noop = () => {};

const baseProps = {
  documentId,
  filename: 'Acme Vendor Agreement 2024.pdf',
  isLoading: false,
  isError: false,
  onBackToContracts: noop,
  onExport: noop,
  onApprove: noop,
  onShare: noop,
};

const metadata: ContractMetadata = {
  contractType: 'Vendor',
  parties: [
    { role: 'Provider', name: 'Acme Corporation' },
    { role: 'Client', name: 'Our Company Ltd' },
  ],
  effectiveDate: '2024-01-15',
  terminationDate: '2025-01-14',
  noticePeriod: '60 days',
  autoRenewal: 'Yes, 1-year terms',
  paymentAmount: '£50,000',
  currency: 'GBP',
  paymentSchedule: 'Quarterly',
  priceEscalation: '2% annual',
  paymentTerms: 'Net 30 days',
};

function clause(
  type: ClauseResponse['type'],
  level: 'critical' | 'high' | 'medium' | 'low',
  score: number,
): ClauseResponse {
  return {
    id: `c-${type}-${level}`,
    extractionRunId: 'run-1',
    documentId,
    parentClauseId: null,
    type,
    confidence: 0.9,
    pageNumber: 1,
    startOffset: 0,
    endOffset: 100,
    text: 'x'.repeat(100),
    hasEmbedding: true,
    risk: { score, level, flags: [], explanation: `mock ${level}` },
    createdAt: new Date().toISOString(),
  };
}

const clauses: ClauseResponse[] = [
  clause('indemnification', 'critical', 85),
  clause('limitation_of_liability', 'high', 70),
  clause('termination', 'medium', 35),
  clause('payment_terms', 'low', 15),
];

const extraction: ExtractionStatusResponse = {
  runId: 'run-1',
  status: 'complete',
  clauseCount: clauses.length,
  droppedClauseCount: 0,
  failureReason: null,
  startedAt: '2026-05-17T13:00:00Z',
  completedAt: '2026-05-17T13:00:30Z',
  metadata,
};

describe('ResultsPage', () => {
  it('renders the Overview tab by default with metadata + risk snapshot', () => {
    render(
      <ResultsPageView
        {...baseProps}
        clauses={clauses}
        extraction={extraction}
      />,
    );

    // Breadcrumb
    expect(screen.getByText('Acme Vendor Agreement 2024.pdf')).toBeInTheDocument();
    // Tabs
    expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    // Risk Assessment card — score + label. Both the main card and the
    // sidebar mini-card surface a "Medium Risk" label; that's intentional.
    expect(screen.getByText(/risk assessment/i)).toBeInTheDocument();
    expect(screen.getAllByText(/medium risk/i).length).toBeGreaterThanOrEqual(1);
    // Parties: Acme appears both in the Parties section and in the
    // sidebar as the Counterparty derivation — at least one is enough.
    expect(screen.getAllByText('Acme Corporation').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Our Company Ltd')).toBeInTheDocument();
    // Financial Terms — £50,000 appears in the section card and sidebar.
    expect(screen.getAllByText('£50,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Net 30 days')).toBeInTheDocument();
  });

  it('clicking the Risk Flags tab shows the accordion + counter bar', async () => {
    const user = userEvent.setup();
    render(
      <ResultsPageView
        {...baseProps}
        clauses={clauses}
        extraction={extraction}
      />,
    );

    await user.click(screen.getByRole('tab', { name: /risk flags/i }));

    // Counter bar
    expect(screen.getByText(/1 critical/i)).toBeInTheDocument();
    expect(screen.getByText(/2 caution/i)).toBeInTheDocument(); // high + medium
    // Flag rows: only critical / high / medium surface as flags (3),
    // low payment_terms stays off this tab.
    const flags = screen.getByLabelText('Risk flags');
    expect(flags.children).toHaveLength(3);
  });

  it('shows "—" for missing metadata fields', () => {
    render(
      <ResultsPageView
        {...baseProps}
        clauses={clauses}
        extraction={{
          ...extraction,
          metadata: {
            contractType: 'Vendor',
            parties: [],
            effectiveDate: null,
            terminationDate: null,
            noticePeriod: null,
            autoRenewal: null,
            paymentAmount: null,
            currency: null,
            paymentSchedule: null,
            priceEscalation: null,
            paymentTerms: null,
          },
        }}
      />,
    );
    // Many — characters across the dashes-filled card + sidebar.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(8);
  });

  it('renders a loading state while queries are pending', () => {
    render(
      <ResultsPageView
        {...baseProps}
        clauses={[]}
        extraction={undefined}
        isLoading
      />,
    );
    expect(screen.getByText(/loading analysis/i)).toBeInTheDocument();
  });

  it('renders an error state when the queries fail', () => {
    render(
      <ResultsPageView
        {...baseProps}
        clauses={[]}
        extraction={undefined}
        isError
      />,
    );
    expect(screen.getByText(/couldn't load this document/i)).toBeInTheDocument();
  });

  it('back-to-contracts is wired through to the prop', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <ResultsPageView
        {...baseProps}
        onBackToContracts={onBack}
        clauses={clauses}
        extraction={extraction}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^contracts$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('Risk Flags accordion mark-resolved toggles local state', async () => {
    const user = userEvent.setup();
    render(
      <ResultsPageView
        {...baseProps}
        clauses={clauses}
        extraction={extraction}
      />,
    );
    await user.click(screen.getByRole('tab', { name: /risk flags/i }));
    // Expand the first flag
    await user.click(
      screen.getAllByRole('button', { expanded: false })[0],
    );
    await user.click(
      screen.getByRole('button', { name: /mark resolved/i }),
    );
    expect(screen.getByText(/✓ resolved/i)).toBeInTheDocument();
  });
});
