export class FailUploadCommand {
  constructor(
    readonly documentId: string,
    /** Short failure reason — same vocabulary as the frontend's UploadFailureReason. */
    readonly reason: string,
    readonly requesterUserId: string,
  ) {}
}
