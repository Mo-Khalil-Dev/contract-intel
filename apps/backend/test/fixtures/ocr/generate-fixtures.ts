/* eslint-disable no-console */
/**
 * One-shot fixture generator for OCR e2e tests.
 *
 * Produces three synthetic PDFs that exercise the three classifier outcomes:
 *
 *   - `scanned-sample.pdf`  → image-only page, no text-showing operators.
 *                             Classifier should tag every page `scanned` →
 *                             routes through the cloud driver (mock fills
 *                             that slot in tests).
 *   - `hybrid-sample.pdf`   → two pages: one digital (real text), one
 *                             image-only. Classifier should produce a
 *                             mixed page list → document driver = `hybrid`.
 *   - `corrupt-sample.pdf`  → garbage bytes with a `%PDF` header. pdfjs
 *                             should reject it → OcrPermanentError('invalid_pdf').
 *
 * Run with:  npx ts-node test/fixtures/ocr/generate-fixtures.ts
 * Outputs in the same directory. Idempotent — overwrites previous runs.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const OUT_DIR = __dirname;

// A 4×4 red PNG. Tiny but real — pdfjs will register it as a paintImageXObject.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEUlEQVQIW2P8z8AARMQDxlEFAJYsAv//yLptAAAAAElFTkSuQmCC',
  'base64',
);

async function generateScanned(): Promise<void> {
  const doc = await PDFDocument.create();
  const png = await doc.embedPng(TINY_PNG);
  const page = doc.addPage([612, 792]);
  // Draw the image filling the page — no text, no font, no Tj operators.
  page.drawImage(png, { x: 0, y: 0, width: 612, height: 792 });
  const bytes = await doc.save();
  await fs.writeFile(join(OUT_DIR, 'scanned-sample.pdf'), bytes);
  console.log(`scanned-sample.pdf — ${bytes.length} bytes`);
}

async function generateHybrid(): Promise<void> {
  const doc = await PDFDocument.create();
  const png = await doc.embedPng(TINY_PNG);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1 — real text (digital)
  const p1 = doc.addPage([612, 792]);
  const longText =
    'Section 1. Indemnification. The Seller shall indemnify and hold harmless ' +
    'the Buyer from any claims, demands, or causes of action arising out of ' +
    'or in connection with this Agreement, including but not limited to those ' +
    'related to negligence, breach of warranty, intellectual property infringement, ' +
    'and any third-party claims. This indemnification obligation shall survive ' +
    'the termination or expiration of this Agreement. Section 2. Confidentiality. ' +
    'Each Party shall hold in strict confidence all proprietary information disclosed ' +
    'by the other Party in connection with this Agreement.';
  p1.drawText(longText, {
    x: 50,
    y: 700,
    size: 11,
    font,
    color: rgb(0, 0, 0),
    maxWidth: 512,
    lineHeight: 14,
  });

  // Page 2 — image-only (scanned)
  const p2 = doc.addPage([612, 792]);
  p2.drawImage(png, { x: 0, y: 0, width: 612, height: 792 });

  const bytes = await doc.save();
  await fs.writeFile(join(OUT_DIR, 'hybrid-sample.pdf'), bytes);
  console.log(`hybrid-sample.pdf — ${bytes.length} bytes`);
}

async function generateCorrupt(): Promise<void> {
  // A buffer that starts like a PDF but is otherwise garbage. pdfjs's
  // structure-parsing pass should throw on it.
  const bytes = Buffer.concat([
    Buffer.from('%PDF-1.4\n', 'utf8'),
    Buffer.alloc(2048, 0xab), // random-looking bytes
    Buffer.from('\n%%EOF\n', 'utf8'),
  ]);
  await fs.writeFile(join(OUT_DIR, 'corrupt-sample.pdf'), bytes);
  console.log(`corrupt-sample.pdf — ${bytes.length} bytes`);
}

async function main(): Promise<void> {
  await generateScanned();
  await generateHybrid();
  await generateCorrupt();
  console.log('OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
