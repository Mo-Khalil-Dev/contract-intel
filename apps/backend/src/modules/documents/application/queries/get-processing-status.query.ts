export class GetProcessingStatusQuery {
  constructor(
    readonly documentId: string,
    readonly requesterUserId: string,
  ) {}
}

/**
 * Powers the `/processing/:id` polling endpoint.
 *
 * `status` is one of the `ProcessingStatusValue` strings. `failureReason`
 * is populated only when `status === 'ocr_failed'`. `userRetryCount`
 * lets the UI decide whether to show the Retry button (3-cap enforced
 * by the aggregate; UI mirrors it for affordance).
 */
export interface GetProcessingStatusResult {
  documentId: string;
  status: string;
  failureReason: string | null;
  userRetryCount: number;
  canRetry: boolean;
}
