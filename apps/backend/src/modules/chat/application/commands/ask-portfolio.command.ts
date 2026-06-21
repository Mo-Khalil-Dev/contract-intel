/**
 * Ask a plain-English question about the user's portfolio (Phase 12,
 * Task 12.3). `threadId` is optional — when absent a new thread is
 * created; when present it must already belong to the user.
 */
export class AskPortfolioCommand {
  constructor(
    readonly userId: string,
    readonly orgId: string,
    readonly question: string,
    readonly threadId?: string,
  ) {}
}
