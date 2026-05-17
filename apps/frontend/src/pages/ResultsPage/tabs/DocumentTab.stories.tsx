import type { Meta, StoryObj } from '@storybook/react-vite';
import { DocumentTabView } from './DocumentTab';
import type { ClauseResponse } from '@/types/clauses';
import type { DocumentTextResponse } from '@/types/documentText';

const documentId = 'b47a490b-fb31-4031-b740-82f8d568dd18' as ClauseResponse['documentId'];

const PAGE_1 = `SERVICE AGREEMENT

This Agreement is entered into as of January 15, 2024, between Acme Corporation ("Vendor") and Our Company Ltd ("Buyer").

1. Indemnification. Vendor shall defend, indemnify, and hold harmless Buyer from any third-party claim arising out of Vendor's breach of this Agreement or Vendor's gross negligence or willful misconduct, without any cap on liability or scope limitations.

2. Limitation of Liability. Except for breaches of confidentiality or indemnification obligations, each party's aggregate liability under this Agreement shall not exceed the fees paid by Buyer in the twelve (12) months preceding the claim.

`;

const PAGE_2 = `3. Termination. Either party may terminate this Agreement for material breach upon thirty (30) days' prior written notice if the breach remains uncured.

4. Payment Terms. Buyer shall pay all undisputed invoices within thirty (30) days of receipt.

5. Governing Law. This Agreement shall be governed by the laws of the State of Delaware.
`;

const FULL_TEXT = PAGE_1 + PAGE_2;

// Hand-computed offsets for the clauses we want to highlight.
const INDEMN_START = FULL_TEXT.indexOf('1. Indemnification.');
const INDEMN_END = FULL_TEXT.indexOf('2. Limitation');
const TERMINATION_START = FULL_TEXT.indexOf('3. Termination.');
const TERMINATION_END = FULL_TEXT.indexOf('4. Payment Terms');

const fakeData: DocumentTextResponse = {
  documentId,
  text: FULL_TEXT,
  pages: [
    {
      pageNumber: 1,
      text: PAGE_1,
      confidence: 1,
      textQualityScore: 0.95,
      driver: 'native_pdf',
    },
    {
      pageNumber: 2,
      text: PAGE_2,
      confidence: 1,
      textQualityScore: 0.95,
      driver: 'native_pdf',
    },
  ],
  confidence: 1,
  minPageConfidence: 1,
  language: 'en',
  driver: 'native_pdf',
  pageCount: 2,
  extractedAt: '2026-05-17T14:00:00Z',
};

const fakeClauses: ClauseResponse[] = [
  {
    id: 'cls-indemn',
    extractionRunId: 'run-1',
    documentId,
    parentClauseId: null,
    type: 'indemnification',
    confidence: 0.97,
    pageNumber: 1,
    startOffset: INDEMN_START,
    endOffset: INDEMN_END,
    text: FULL_TEXT.slice(INDEMN_START, INDEMN_END),
    hasEmbedding: true,
    risk: {
      score: 88,
      level: 'critical',
      flags: ['uncapped_liability'],
      explanation: 'No cap on damages — unbounded exposure.',
    },
    createdAt: '2026-05-17T14:00:00Z',
  },
  {
    id: 'cls-termination',
    extractionRunId: 'run-1',
    documentId,
    parentClauseId: null,
    type: 'termination',
    confidence: 0.94,
    pageNumber: 2,
    startOffset: TERMINATION_START,
    endOffset: TERMINATION_END,
    text: FULL_TEXT.slice(TERMINATION_START, TERMINATION_END),
    hasEmbedding: true,
    risk: {
      score: 60,
      level: 'high',
      flags: [],
      explanation: '30-day cure is below market standard.',
    },
    createdAt: '2026-05-17T14:00:00Z',
  },
  // Medium-risk clause that should NOT get highlighted.
  {
    id: 'cls-payment',
    extractionRunId: 'run-1',
    documentId,
    parentClauseId: null,
    type: 'payment_terms',
    confidence: 0.92,
    pageNumber: 2,
    startOffset: FULL_TEXT.indexOf('4. Payment Terms.'),
    endOffset: FULL_TEXT.indexOf('5. Governing Law.'),
    text: FULL_TEXT.slice(
      FULL_TEXT.indexOf('4. Payment Terms.'),
      FULL_TEXT.indexOf('5. Governing Law.'),
    ),
    hasEmbedding: true,
    risk: {
      score: 30,
      level: 'medium',
      flags: [],
      explanation: 'Standard Net-30 terms.',
    },
    createdAt: '2026-05-17T14:00:00Z',
  },
];

const meta: Meta<typeof DocumentTabView> = {
  title: 'Pages/ResultsPage/DocumentTab',
  component: DocumentTabView,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof DocumentTabView>;

/** Full contract with one critical + one high highlight. */
export const Default: Story = {
  args: {
    filename: 'Acme Vendor Agreement 2024.pdf',
    data: fakeData,
    clauses: fakeClauses,
    isLoading: false,
    isError: false,
  },
};

/** No highlights — all clauses medium/low risk. */
export const NoHighlights: Story = {
  args: {
    filename: 'Standard NDA.pdf',
    data: fakeData,
    clauses: fakeClauses.map((c) => ({
      ...c,
      risk: c.risk
        ? { ...c.risk, level: 'medium', score: 40 }
        : null,
    })),
    isLoading: false,
    isError: false,
  },
};

/** Loading. */
export const Loading: Story = {
  args: {
    filename: undefined,
    data: undefined,
    clauses: [],
    isLoading: true,
    isError: false,
  },
};

/** Backend error. */
export const NetworkError: Story = {
  args: {
    filename: 'Acme Vendor Agreement 2024.pdf',
    data: undefined,
    clauses: [],
    isLoading: false,
    isError: true,
  },
};
