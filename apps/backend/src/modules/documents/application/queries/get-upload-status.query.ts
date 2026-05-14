export class GetUploadStatusQuery {
  constructor(
    readonly documentId: string,
    readonly requesterUserId: string,
  ) {}
}

export interface GetUploadStatusResult {
  documentId: string;
  status: 'pending' | 'uploading' | 'complete' | 'failed';
  uploadedAt: string | null;
  failureReason: string | null;
}
