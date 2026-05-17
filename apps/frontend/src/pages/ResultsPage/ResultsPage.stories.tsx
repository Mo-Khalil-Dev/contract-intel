import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResultsPageView } from './ResultsPage.view';
import type {
  ClauseResponse,
  ContractMetadata,
  ExtractionStatusResponse,
} from '@/types/clauses';

const documentId = 'b47a490b-fb31-4031-b740-82f8d568dd18';
const noop = () => {};

const baseArgs = {
  documentId,
  filename: 'Acme Vendor Agreement 2024.pdf',
  isLoading: false,
  isError: false,
  onBackToContracts: noop,
  onExport: noop,
  onApprove: noop,
  onShare: noop,
};

const fullMetadata: ContractMetadata = {
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

function makeClause(overrides: Partial<ClauseResponse> = {}): ClauseResponse {
  return {
    id: `c-${Math.random().toString(36).slice(2, 8)}`,
    extractionRunId: 'run-1',
    documentId: documentId as ClauseResponse['documentId'],
    parentClauseId: null,
    type: 'indemnification',
    confidence: 0.9,
    pageNumber: 1,
    startOffset: 0,
    endOffset: 100,
    text: 'A '.repeat(50),
    hasEmbedding: true,
    risk: { score: 60, level: 'high', flags: [], explanation: 'Mock high risk.' },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const fullClauses: ClauseResponse[] = [
  makeClause({
    type: 'indemnification',
    risk: { score: 85, level: 'critical', flags: ['uncapped'], explanation: '' },
  }),
  makeClause({
    type: 'limitation_of_liability',
    risk: { score: 70, level: 'high', flags: [], explanation: '' },
  }),
  makeClause({
    type: 'termination',
    risk: { score: 35, level: 'medium', flags: [], explanation: '' },
  }),
  makeClause({
    type: 'payment_terms',
    risk: { score: 20, level: 'low', flags: [], explanation: '' },
  }),
  makeClause({
    type: 'governing_law',
    risk: { score: 15, level: 'low', flags: [], explanation: '' },
  }),
];

function makeExtraction(
  metadata: ContractMetadata | null = fullMetadata,
): ExtractionStatusResponse {
  return {
    runId: 'run-1',
    status: 'complete',
    clauseCount: 5,
    droppedClauseCount: 0,
    failureReason: null,
    startedAt: '2026-05-17T13:00:00Z',
    completedAt: '2026-05-17T13:00:30Z',
    metadata,
  };
}

const meta: Meta<typeof ResultsPageView> = {
  title: 'Pages/ResultsPage',
  component: ResultsPageView,
  parameters: { layout: 'fullscreen', backgrounds: { default: 'light' } },
  args: baseArgs,
};
export default meta;
type Story = StoryObj<typeof ResultsPageView>;

/** Default — full metadata, mixed clause severity. */
export const Default: Story = {
  args: {
    ...baseArgs,
    clauses: fullClauses,
    extraction: makeExtraction(),
  },
};

/** Empty clauses — extraction completed with 0 results. Risk score
 *  shows "—" and the flag counts collapse to zeros. */
export const NoClauses: Story = {
  args: {
    ...baseArgs,
    clauses: [],
    extraction: makeExtraction(),
  },
};

/** Partial metadata — most fields null. Verifies the dash fallback. */
export const PartialMetadata: Story = {
  args: {
    ...baseArgs,
    clauses: fullClauses.slice(0, 2),
    extraction: makeExtraction({
      contractType: 'Vendor',
      parties: [{ role: 'Provider', name: 'Acme Corporation' }],
      effectiveDate: '2024-01-15',
      terminationDate: null,
      noticePeriod: null,
      autoRenewal: null,
      paymentAmount: '£50,000',
      currency: null,
      paymentSchedule: null,
      priceEscalation: null,
      paymentTerms: null,
    }),
  },
};

/** Low-risk profile — all clauses low; risk card goes green. */
export const LowRisk: Story = {
  args: {
    ...baseArgs,
    clauses: [
      makeClause({
        type: 'payment_terms',
        risk: { score: 10, level: 'low', flags: [], explanation: '' },
      }),
      makeClause({
        type: 'governing_law',
        risk: { score: 15, level: 'low', flags: [], explanation: '' },
      }),
    ],
    extraction: makeExtraction(),
  },
};

/** Loading — first paint while both queries are pending. */
export const Loading: Story = {
  args: {
    ...baseArgs,
    isLoading: true,
    clauses: [],
    extraction: undefined,
  },
};

/** Error — backend unavailable. */
export const NetworkError: Story = {
  args: {
    ...baseArgs,
    isError: true,
    clauses: [],
    extraction: undefined,
  },
};

/** No metadata yet (extraction still in flight on the backend, but
 *  the read endpoint returned an empty snapshot). */
export const NoMetadata: Story = {
  args: {
    ...baseArgs,
    clauses: fullClauses,
    extraction: makeExtraction(null),
  },
};
