export class InitiateUploadCommand {
  constructor(
    readonly fileName: string,
    readonly fileSizeBytes: number,
    readonly mimeType: string,
    /** Authenticated user from the session — used to set uploadedBy + derive orgId. */
    readonly requesterUserId: string,
  ) {}
}

export interface InitiateUploadResult {
  documentId: string;
  uploadUrl: string;
  expiresAt: Date;
  /** HTTP method the browser should use for the PUT — always 'PUT' in v1. */
  method: 'PUT';
}
