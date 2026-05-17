export class FailClauseExtractionCommand {
  constructor(
    readonly documentId: string,
    /** Short colon-separated reason token. */
    readonly reason: string,
  ) {}
}
