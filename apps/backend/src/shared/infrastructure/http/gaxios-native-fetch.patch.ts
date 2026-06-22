/**
 * Force gaxios — the HTTP transport used by `@google-cloud/*` and
 * `google-auth-library` — to use Node's native `fetch` instead of its
 * bundled `node-fetch`.
 *
 * Why: on Node 22, gaxios 6.x's `node-fetch` throws
 * `ERR_STREAM_PREMATURE_CLOSE` while decompressing the gzip response from
 * the GCS OAuth token endpoint (`https://www.googleapis.com/oauth2/v4/token`),
 * which breaks every GCS upload in production. Native `fetch` handles the
 * exact same response correctly — verified in the running container:
 *   - node-fetch  → ERR_STREAM_PREMATURE_CLOSE
 *   - native fetch → 200/400 with body read fine
 *
 * google-auth-library builds its own `Gaxios` transporter instances
 * internally, so patching a single instance isn't enough. We wrap
 * `Gaxios.prototype.request` so every instance — auth transporters and the
 * Storage client alike — defaults to native fetch on first use, unless a
 * `fetchImplementation` was explicitly set.
 *
 * This file has side effects on import and MUST be imported before any
 * Google client is constructed (i.e. as the very first import in main.ts).
 */
import { Gaxios } from 'gaxios';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proto = Gaxios.prototype as any;
const originalRequest = proto.request;

if (!proto.__nativeFetchPatched) {
  proto.__nativeFetchPatched = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proto.request = function patchedRequest(this: any, ...args: any[]) {
    if (this?.defaults && !this.defaults.fetchImplementation) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.defaults.fetchImplementation = (input: any, init?: any) =>
        fetch(input, init);
    }
    return originalRequest.apply(this, args);
  };
}
