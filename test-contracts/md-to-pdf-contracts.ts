/* eslint-disable no-console */
/**
 * Renders the Playbook-Driven Contract Review seed contracts (authored as
 * markdown in test-contracts/*.md) to PDFs in test-contracts/output/, so they
 * can be ingested by the Phase 8 pipeline and reviewed by the Phase 13 agent.
 *
 * Markdown is the source of truth; this is a deliberately minimal renderer
 * (title / section headings / paragraphs, with wrapping + pagination). Inline
 * emphasis markers are stripped — the ingestion pipeline OCRs plain text, so
 * bold/italic carry no signal. The leading HTML comment block (the demo
 * rule-map note) is skipped.
 *
 * Run from repo root:
 *   npx ts-node --transpile-only test-contracts/md-to-pdf-contracts.ts
 *
 * Idempotent — overwrites previous runs.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { PDFDocument, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';

const SRC_DIR = __dirname;
const OUT_DIR = join(__dirname, 'output');

const SOURCES = [
  'apex-msa-critical.md',
  'northwind-saas-compliant.md',
  'meridian-msa-medium.md',
  'sterling-vsa-high.md',
];

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 56;
const MARGIN_Y_TOP = 56;
const MARGIN_Y_BOTTOM = 56;
const LINE_HEIGHT = 14;
const FONT_SIZE = 10.5;
const HEADING_SIZE = 13;
const TITLE_SIZE = 18;

const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

interface Ctx {
  doc: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
  page: PDFPage;
  y: number;
}

type Block =
  | { kind: 'title'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'para'; text: string };

/** Drop the leading HTML comment block and parse the markdown into blocks. */
function parse(md: string): Block[] {
  const withoutComment = md.replace(/<!--[\s\S]*?-->/g, '');
  const blocks: Block[] = [];
  for (const raw of withoutComment.split('\n')) {
    const line = stripInline(raw.trim());
    if (!line || line === '---') continue;
    if (line.startsWith('## ')) {
      blocks.push({ kind: 'heading', text: line.slice(3).trim() });
    } else if (line.startsWith('# ')) {
      blocks.push({ kind: 'title', text: line.slice(2).trim() });
    } else {
      blocks.push({ kind: 'para', text: line });
    }
  }
  return blocks;
}

/** Strip markdown emphasis / code markers; keep the text. */
function stripInline(s: string): string {
  return s
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)/g, '')
    .replace(/`/g, '')
    .replace(/_/g, '');
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function newPage(ctx: Ctx): void {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - MARGIN_Y_TOP;
}

function ensureRoom(ctx: Ctx, needed: number): void {
  if (ctx.y - needed < MARGIN_Y_BOTTOM) newPage(ctx);
}

function drawParagraph(
  ctx: Ctx,
  text: string,
  font: PDFFont,
  size: number,
  gapAfter: number,
): void {
  for (const line of wrap(text, font, size, CONTENT_WIDTH)) {
    ensureRoom(ctx, LINE_HEIGHT);
    ctx.page.drawText(line, { x: MARGIN_X, y: ctx.y, size, font });
    ctx.y -= LINE_HEIGHT;
  }
  ctx.y -= gapAfter;
}

async function render(blocks: Block[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const ctx: Ctx = {
    doc,
    font,
    fontBold,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN_Y_TOP,
  };

  for (const block of blocks) {
    if (block.kind === 'title') {
      drawParagraph(ctx, block.text, fontBold, TITLE_SIZE, 10);
    } else if (block.kind === 'heading') {
      ensureRoom(ctx, LINE_HEIGHT * 2);
      ctx.y -= 4;
      drawParagraph(ctx, block.text, fontBold, HEADING_SIZE, 4);
    } else {
      drawParagraph(ctx, block.text, font, FONT_SIZE, 6);
    }
  }

  return doc.save();
}

async function main(): Promise<void> {
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const src of SOURCES) {
    const md = await fs.readFile(join(SRC_DIR, src), 'utf8');
    const bytes = await render(parse(md));
    const out = join(OUT_DIR, src.replace(/\.md$/, '.pdf'));
    await fs.writeFile(out, bytes);
    console.log(`✓ ${src} → output/${src.replace(/\.md$/, '.pdf')}  (${bytes.length} bytes)`);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
