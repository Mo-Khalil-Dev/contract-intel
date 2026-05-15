/**
 * pdfjs-dist v4 is ESM-only and our backend transpiles to CommonJS, so
 * we can't statically `import` it. This loader does a dynamic import
 * once and caches the module across calls.
 *
 * Use the `legacy` build — it's the one designed for Node (no DOM globals,
 * no canvas requirement). The classifier and the native extractor both
 * go through this helper.
 */

// Loose type for the bits of the pdfjs API we use. Avoids depending on
// pdfjs-dist's own types from CommonJS-land where the import would fail
// at compile time.
export interface PdfjsModule {
  getDocument(src: { data: Uint8Array } | { url: string }): {
    promise: Promise<PdfDocument>;
  };
  OPS: Record<string, number>;
}

export interface PdfDocument {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
}

export interface PdfPage {
  getTextContent(): Promise<{ items: Array<unknown> }>;
  getOperatorList(): Promise<{ fnArray: number[]; argsArray: unknown[] }>;
}

let cached: Promise<PdfjsModule> | null = null;

/**
 * Wrap `import()` so the TypeScript compiler (and ts-jest's CommonJS
 * transform) doesn't rewrite it into a synchronous `require()` — that
 * blows up on the ESM-only `.mjs` build. The `eval` keeps the call
 * opaque to both transforms; Node executes it as a real dynamic import.
 */
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-eval
const dynamicImport = eval('(spec) => import(spec)') as (
  spec: string,
) => Promise<unknown>;

export function loadPdfjs(): Promise<PdfjsModule> {
  if (!cached) {
    cached = (async () => {
      // The legacy build ships as `pdfjs-dist/legacy/build/pdf.mjs` and
      // works in Node without DOM polyfills. v4 default export is the
      // module namespace.
      const mod = (await dynamicImport(
        'pdfjs-dist/legacy/build/pdf.mjs',
      )) as PdfjsModule;
      return mod;
    })();
  }
  return cached;
}
