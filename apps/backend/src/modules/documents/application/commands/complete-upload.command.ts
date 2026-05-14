export class CompleteUploadCommand {
  constructor(
    readonly documentId: string,
    /** Authenticated user from the session — used to scope the lookup. */
    readonly requesterUserId: string,
  ) {}
}
