export class GetDocumentTextQuery {
  constructor(
    readonly documentId: string,
    /** Authenticated user from the session — used to scope the lookup. */
    readonly requesterUserId: string,
  ) {}
}

export interface GetDocumentTextResult {
  documentId: string;
  text: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
    textQualityScore: number;
    driver: string;
  }>;
  confidence: number;
  minPageConfidence: number;
  language: string;
  driver: string;
  pageCount: number;
  extractedAt: string;
}
