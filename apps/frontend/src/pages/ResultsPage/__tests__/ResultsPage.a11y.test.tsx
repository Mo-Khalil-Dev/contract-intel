import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ResultsPageView } from '../ResultsPage.view';
import { DocumentTabView } from '../tabs/DocumentTab';
import type {
  ClauseResponse,
  ContractMetadata,
  ExtractionStatusResponse,
} from '@/types/clauses';
import type { DocumentTextResponse } from '@/types/documentText';

expect.extend(toHaveNoViolations);

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
    risk: { score, level, flags: [], explanation: `mock ${level} explanation` },
    createdAt: new Date().toISOString(),
  };
}

const clauses: ClauseResponse[] = [
  clause('indemnification', 'critical', 85),
  clause('limitation_of_liability', 'high', 70),
  clause('termination', 'medium', 35),
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

describe('ResultsPage — Accessibility', () => {
  it('Overview tab has no axe violations', async () => {
    const { container } = render(
      <ResultsPageView
        {...baseProps}
        clauses={clauses}
        extraction={extraction}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Loading state has no axe violations', async () => {
    const { container } = render(
      <ResultsPageView
        {...baseProps}
        clauses={[]}
        extraction={undefined}
        isLoading
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Error state has no axe violations', async () => {
    const { container } = render(
      <ResultsPageView
        {...baseProps}
        clauses={[]}
        extraction={undefined}
        isError
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('DocumentTab — Accessibility', () => {
  const documentText: DocumentTextResponse = {
    documentId,
    text: '1. Indemnification. Vendor shall indemnify Buyer. 2. Payment terms.',
    pages: [
      {
        pageNumber: 1,
        text: '1. Indemnification. Vendor shall indemnify Buyer. 2. Payment terms.',
        confidence: 1,
        textQualityScore: 0.95,
        driver: 'native_pdf',
      },
    ],
    confidence: 1,
    minPageConfidence: 1,
    language: 'en',
    driver: 'native_pdf',
    pageCount: 1,
    extractedAt: '2026-05-17T13:00:00Z',
  };

  it('populated state has no axe violations', async () => {
    const { container } = render(
      <DocumentTabView
        filename="Acme Vendor Agreement 2024.pdf"
        data={documentText}
        isLoading={false}
        isError={false}
        clauses={clauses.map((c) => ({
          ...c,
          startOffset: 0,
          endOffset: c.risk?.level === 'critical' ? 18 : 0,
        }))}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('error state has no axe violations', async () => {
    const { container } = render(
      <DocumentTabView
        filename="x.pdf"
        data={undefined}
        isLoading={false}
        isError
        clauses={[]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('loading state has no axe violations', async () => {
    const { container } = render(
      <DocumentTabView
        filename="x.pdf"
        data={undefined}
        isLoading
        isError={false}
        clauses={[]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
