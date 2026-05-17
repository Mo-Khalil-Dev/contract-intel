/* eslint-disable no-console */
/**
 * Generates a small portfolio of synthetic contract PDFs for manual
 * end-to-end testing of the Phase 8 pipeline.
 *
 * Each contract is designed to exercise a different mix of clause
 * types + risk levels so the UI can be visually verified across the
 * full range of states:
 *
 *   1. saas-vendor-balanced.pdf    — Standard market terms, low/medium risk
 *   2. saas-vendor-risky.pdf       — Aggressive vendor-side, high/critical risk
 *   3. nda-mutual.pdf              — Short, simple, mostly low risk
 *   4. msa-services.pdf            — Larger Master Services Agreement
 *   5. employment-senior.pdf       — IP assignment, non-compete, restrictive
 *
 * Output: test-contracts/output/*.pdf
 *
 * Run with:
 *   cd test-contracts
 *   npx ts-node --transpile-only generate-test-contracts.ts
 *
 * Or (from repo root):
 *   npx ts-node --transpile-only test-contracts/generate-test-contracts.ts
 *
 * Idempotent — overwrites previous runs.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { PDFDocument, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';

const OUT_DIR = join(__dirname, 'output');

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 56;
const MARGIN_Y_TOP = 56;
const MARGIN_Y_BOTTOM = 56;
const LINE_HEIGHT = 14;
const FONT_SIZE = 10.5;
const HEADING_SIZE = 13;
const TITLE_SIZE = 18;

interface DrawCtx {
  doc: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
  page: PDFPage;
  y: number;
}

async function newCtx(): Promise<DrawCtx> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { doc, font, fontBold, page, y: PAGE_HEIGHT - MARGIN_Y_TOP };
}

function ensureRoom(ctx: DrawCtx, neededLines: number): void {
  const required = neededLines * LINE_HEIGHT;
  if (ctx.y - required < MARGIN_Y_BOTTOM) {
    ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    ctx.y = PAGE_HEIGHT - MARGIN_Y_TOP;
  }
}

/**
 * Naive word-wrap to fit within the right margin. pdf-lib doesn't
 * ship one; this is good enough for fixture text.
 */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawTitle(ctx: DrawCtx, text: string): void {
  const lines = wrap(
    text,
    ctx.fontBold,
    TITLE_SIZE,
    PAGE_WIDTH - 2 * MARGIN_X,
  );
  ensureRoom(ctx, lines.length + 1);
  for (const line of lines) {
    const w = ctx.fontBold.widthOfTextAtSize(line, TITLE_SIZE);
    ctx.page.drawText(line, {
      x: (PAGE_WIDTH - w) / 2,
      y: ctx.y,
      size: TITLE_SIZE,
      font: ctx.fontBold,
    });
    ctx.y -= TITLE_SIZE + 4;
  }
  ctx.y -= LINE_HEIGHT;
}

function drawHeading(ctx: DrawCtx, text: string): void {
  ensureRoom(ctx, 2);
  ctx.y -= LINE_HEIGHT * 0.5;
  ctx.page.drawText(text, {
    x: MARGIN_X,
    y: ctx.y,
    size: HEADING_SIZE,
    font: ctx.fontBold,
  });
  ctx.y -= HEADING_SIZE + 4;
}

function drawParagraph(ctx: DrawCtx, text: string): void {
  const lines = wrap(text, ctx.font, FONT_SIZE, PAGE_WIDTH - 2 * MARGIN_X);
  for (const line of lines) {
    ensureRoom(ctx, 1);
    ctx.page.drawText(line, {
      x: MARGIN_X,
      y: ctx.y,
      size: FONT_SIZE,
      font: ctx.font,
    });
    ctx.y -= LINE_HEIGHT;
  }
  ctx.y -= LINE_HEIGHT * 0.3;
}

// ── Contracts ────────────────────────────────────────────────────

async function saasVendorBalanced(): Promise<Uint8Array> {
  const ctx = await newCtx();
  drawTitle(ctx, 'SOFTWARE AS A SERVICE AGREEMENT');
  drawParagraph(
    ctx,
    'This Software as a Service Agreement ("Agreement") is entered into as of March 1, 2024, by and between Cloudly Inc., a Delaware corporation ("Provider"), and Northwind Holdings Ltd, an English company ("Customer").',
  );

  drawHeading(ctx, '1. Services');
  drawParagraph(
    ctx,
    "Provider shall make the Cloudly platform available to Customer in accordance with the Service Level Agreement attached hereto as Exhibit A. Customer's use of the Services is governed by Provider's Acceptable Use Policy.",
  );

  drawHeading(ctx, '2. Payment Terms');
  drawParagraph(
    ctx,
    'Customer shall pay Provider an annual subscription fee of £45,000, invoiced annually in advance. Invoices shall be due and payable within thirty (30) days of the invoice date. Fees are exclusive of taxes.',
  );

  drawHeading(ctx, '3. Term and Termination');
  drawParagraph(
    ctx,
    'This Agreement shall commence on the Effective Date and continue for an initial term of twelve (12) months. Thereafter, the Agreement shall renew automatically for successive one-year terms unless either party provides at least sixty (60) days written notice of non-renewal.',
  );
  drawParagraph(
    ctx,
    'Either party may terminate this Agreement for material breach upon thirty (30) days written notice if such breach remains uncured.',
  );

  drawHeading(ctx, '4. Limitation of Liability');
  drawParagraph(
    ctx,
    "Except for breaches of confidentiality, indemnification obligations, or gross negligence or willful misconduct, each party's aggregate liability under this Agreement shall not exceed the fees paid by Customer to Provider in the twelve (12) months preceding the claim. In no event shall either party be liable for indirect, incidental, or consequential damages.",
  );

  drawHeading(ctx, '5. Indemnification');
  drawParagraph(
    ctx,
    'Provider shall defend, indemnify, and hold harmless Customer from any third-party claim alleging that the Services infringe a valid US patent, copyright, or trademark, provided Customer promptly notifies Provider of such claim and provides reasonable cooperation in the defense.',
  );

  drawHeading(ctx, '6. Confidentiality');
  drawParagraph(
    ctx,
    'Each party shall hold in strict confidence all non-public information disclosed by the other party in connection with this Agreement and shall use such information only for purposes of performing under this Agreement. Confidentiality obligations shall survive termination for a period of three (3) years.',
  );

  drawHeading(ctx, '7. Data Protection');
  drawParagraph(
    ctx,
    'Each party shall comply with all applicable data protection laws, including the UK GDPR and the Data Protection Act 2018. Provider acts as a data processor and shall process Customer Personal Data only on documented instructions from Customer.',
  );

  drawHeading(ctx, '8. Governing Law');
  drawParagraph(
    ctx,
    'This Agreement shall be governed by and construed in accordance with the laws of England and Wales. The courts of England shall have exclusive jurisdiction over any disputes arising out of this Agreement.',
  );

  return ctx.doc.save();
}

async function saasVendorRisky(): Promise<Uint8Array> {
  const ctx = await newCtx();
  drawTitle(ctx, 'VENDOR SERVICES AGREEMENT');
  drawParagraph(
    ctx,
    'This Vendor Services Agreement is entered into as of June 15, 2024, between RapidScale Technologies LLC ("Vendor") and Acme Holdings Ltd ("Buyer").',
  );

  drawHeading(ctx, '1. Indemnification');
  drawParagraph(
    ctx,
    'Buyer shall defend, indemnify, and hold harmless Vendor, its officers, directors, employees, agents, affiliates, successors, and assigns from and against any and all claims, demands, suits, actions, damages, losses, costs (including reasonable attorneys fees), expenses, and judgments of any kind whatsoever arising out of or in connection with this Agreement, the Services, or any act or omission of Buyer, including without limitation any claims based on negligence, gross negligence, willful misconduct, or strict liability, regardless of whether such claims are brought by third parties or arise under contract, tort, statute, or any other legal theory.',
  );

  drawHeading(ctx, '2. Limitation of Liability');
  drawParagraph(
    ctx,
    "Vendor's liability under this Agreement shall be unlimited for any breach. Buyer waives any right to seek indirect, consequential, special, or punitive damages against Vendor under any circumstances whatsoever.",
  );

  drawHeading(ctx, '3. Termination');
  drawParagraph(
    ctx,
    'Vendor may terminate this Agreement at any time for any reason or no reason upon five (5) days written notice to Buyer. Buyer may not terminate this Agreement except in the event of material breach by Vendor that remains uncured for ninety (90) days after written notice.',
  );

  drawHeading(ctx, '4. Auto-Renewal');
  drawParagraph(
    ctx,
    'This Agreement shall automatically renew for successive three (3) year terms unless Buyer provides written notice of non-renewal at least one hundred and eighty (180) days prior to the end of the then-current term. Auto-renewal shall include an annual price escalation of fifteen percent (15%).',
  );

  drawHeading(ctx, '5. Payment Terms');
  drawParagraph(
    ctx,
    'Buyer shall pay all invoices within seven (7) days of receipt. Late payments shall accrue interest at the rate of two percent (2%) per month. Buyer waives any right to dispute or set off invoiced amounts.',
  );

  drawHeading(ctx, '6. Intellectual Property');
  drawParagraph(
    ctx,
    'All intellectual property created, developed, or contributed by Buyer in connection with this Agreement, including any feedback, suggestions, or improvements, shall be the sole and exclusive property of Vendor, with Buyer hereby assigning all right, title, and interest therein to Vendor without further consideration.',
  );

  drawHeading(ctx, '7. Non-Compete');
  drawParagraph(
    ctx,
    'During the Term and for a period of five (5) years thereafter, Buyer shall not, directly or indirectly, engage in any business that competes with Vendor anywhere in the world.',
  );

  drawHeading(ctx, '8. Governing Law and Dispute Resolution');
  drawParagraph(
    ctx,
    'This Agreement shall be governed by the laws of the Cayman Islands. Any dispute shall be resolved exclusively through binding arbitration in George Town, Cayman Islands, under the rules of an arbitration provider selected by Vendor in its sole discretion. Buyer waives any right to trial by jury and to participate in any class action.',
  );

  return ctx.doc.save();
}

async function ndaMutual(): Promise<Uint8Array> {
  const ctx = await newCtx();
  drawTitle(ctx, 'MUTUAL NON-DISCLOSURE AGREEMENT');
  drawParagraph(
    ctx,
    'This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of September 12, 2024, between Helix Biotech Inc. and Northwind Holdings Ltd (each a "Party" and collectively the "Parties").',
  );

  drawHeading(ctx, '1. Confidentiality');
  drawParagraph(
    ctx,
    'Each Party agrees to hold in strict confidence all Confidential Information disclosed to it by the other Party and to use such Confidential Information solely for the purpose of evaluating a potential business relationship between the Parties. Each Party shall protect the Confidential Information of the other with the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care.',
  );

  drawHeading(ctx, '2. Term');
  drawParagraph(
    ctx,
    'The obligations of confidentiality under this Agreement shall remain in effect for a period of three (3) years from the Effective Date.',
  );

  drawHeading(ctx, '3. Termination');
  drawParagraph(
    ctx,
    'Either Party may terminate this Agreement upon thirty (30) days written notice to the other Party. Termination shall not affect the continuing confidentiality obligations of either Party with respect to Confidential Information disclosed prior to termination.',
  );

  drawHeading(ctx, '4. Return of Materials');
  drawParagraph(
    ctx,
    'Upon termination of this Agreement or upon written request, each Party shall promptly return or destroy all Confidential Information of the other Party in its possession.',
  );

  drawHeading(ctx, '5. Governing Law');
  drawParagraph(
    ctx,
    'This Agreement shall be governed by the laws of the State of Delaware. The Parties consent to the exclusive jurisdiction of the state and federal courts located in Wilmington, Delaware.',
  );

  drawHeading(ctx, '6. Limitation of Liability');
  drawParagraph(
    ctx,
    "Neither Party shall be liable to the other for any indirect, consequential, special, or punitive damages arising out of this Agreement. Each Party's aggregate liability shall not exceed five thousand pounds (£5,000).",
  );

  return ctx.doc.save();
}

async function msaServices(): Promise<Uint8Array> {
  const ctx = await newCtx();
  drawTitle(ctx, 'MASTER SERVICES AGREEMENT');
  drawParagraph(
    ctx,
    'This Master Services Agreement (the "Agreement") is made effective as of January 1, 2024, by and between Stonehaven Consulting Group plc ("Consultant") and BlueArrow Industries Ltd ("Client").',
  );

  drawHeading(ctx, '1. Services');
  drawParagraph(
    ctx,
    'Consultant shall provide professional consulting services to Client pursuant to one or more Statements of Work executed by the Parties. Each Statement of Work shall identify the specific services, deliverables, timeline, fees, and any additional terms applicable thereto.',
  );

  drawHeading(ctx, '2. Compensation and Payment Terms');
  drawParagraph(
    ctx,
    "Client shall pay Consultant in accordance with the fees set forth in each Statement of Work. The aggregate value of services under this Agreement is estimated at £250,000 over the initial term, billed monthly in arrears. Invoices shall be due within forty-five (45) days of receipt. Fees may be escalated annually by an amount equal to the UK Consumer Price Index plus one percent (CPI + 1%).",
  );

  drawHeading(ctx, '3. Term');
  drawParagraph(
    ctx,
    'This Agreement shall commence on the Effective Date and continue for an initial term of two (2) years, renewing automatically for successive one-year terms unless either Party provides ninety (90) days prior written notice of non-renewal.',
  );

  drawHeading(ctx, '4. Termination');
  drawParagraph(
    ctx,
    'Either Party may terminate this Agreement for convenience upon sixty (60) days written notice. Either Party may terminate immediately upon written notice if the other Party (a) commits a material breach which remains uncured for thirty (30) days after written notice, or (b) becomes insolvent or files for bankruptcy.',
  );

  drawHeading(ctx, '5. Intellectual Property');
  drawParagraph(
    ctx,
    'All deliverables created by Consultant specifically for Client under a Statement of Work shall be deemed "work made for hire" and shall be the exclusive property of Client. Consultant retains ownership of all pre-existing intellectual property, methodologies, and know-how used in providing the Services, and grants Client a non-exclusive, royalty-free license to use such pre-existing IP solely as embedded in the deliverables.',
  );

  drawHeading(ctx, '6. Confidentiality');
  drawParagraph(
    ctx,
    'Each Party shall hold all Confidential Information of the other in strict confidence and shall use it only for purposes of performing under this Agreement. Confidentiality obligations shall survive termination for five (5) years.',
  );

  drawHeading(ctx, '7. Representations and Warranties');
  drawParagraph(
    ctx,
    'Each Party represents and warrants that (a) it has full power and authority to enter into this Agreement, (b) its performance will not violate any other agreement, and (c) services shall be performed in a professional and workmanlike manner consistent with industry standards.',
  );

  drawHeading(ctx, '8. Indemnification');
  drawParagraph(
    ctx,
    "Each Party shall defend, indemnify, and hold harmless the other Party from any third-party claim arising from the indemnifying Party's gross negligence, willful misconduct, or breach of representations and warranties. Indemnification is contingent on prompt written notice of the claim and reasonable cooperation in the defense.",
  );

  drawHeading(ctx, '9. Limitation of Liability');
  drawParagraph(
    ctx,
    "Except for indemnification obligations, breaches of confidentiality, and willful misconduct, each Party's aggregate liability under this Agreement shall not exceed the fees paid or payable to Consultant in the twelve (12) months preceding the claim. Neither Party shall be liable for indirect, consequential, or punitive damages.",
  );

  drawHeading(ctx, '10. Force Majeure');
  drawParagraph(
    ctx,
    'Neither Party shall be liable for any failure or delay in performance under this Agreement to the extent caused by events beyond its reasonable control, including acts of God, war, terrorism, pandemic, governmental action, or labor disputes.',
  );

  drawHeading(ctx, '11. Governing Law and Dispute Resolution');
  drawParagraph(
    ctx,
    'This Agreement shall be governed by the laws of England and Wales. Any dispute shall first be addressed by escalation to senior executives of both Parties. If unresolved within thirty (30) days, the dispute shall be referred to confidential mediation under the rules of the Centre for Effective Dispute Resolution. Failing resolution within sixty (60) days of mediation, the dispute shall be resolved in the courts of England.',
  );

  drawHeading(ctx, '12. Assignment');
  drawParagraph(
    ctx,
    'Neither Party may assign this Agreement without the prior written consent of the other Party, except in connection with a merger, acquisition, or sale of all or substantially all of its assets. Any prohibited assignment shall be void.',
  );

  return ctx.doc.save();
}

async function employmentSenior(): Promise<Uint8Array> {
  const ctx = await newCtx();
  drawTitle(ctx, 'EXECUTIVE EMPLOYMENT AGREEMENT');
  drawParagraph(
    ctx,
    'This Executive Employment Agreement is entered into as of November 4, 2024, by and between Apex Robotics PLC, a company incorporated in England and Wales ("Company"), and Dr. Eleanor Chen ("Executive").',
  );

  drawHeading(ctx, '1. Position and Duties');
  drawParagraph(
    ctx,
    "Company hereby employs Executive as Chief Technology Officer, reporting to the Chief Executive Officer. Executive shall perform such duties as are customary for the position and as may be reasonably assigned by the Board from time to time. Executive shall devote her full business time and attention to the Company's affairs.",
  );

  drawHeading(ctx, '2. Compensation');
  drawParagraph(
    ctx,
    'Company shall pay Executive an annual base salary of £220,000, payable in monthly instalments in accordance with the Company\'s standard payroll practices. Executive shall be eligible for an annual performance bonus of up to fifty percent (50%) of base salary, subject to achievement of objectives determined by the Board.',
  );

  drawHeading(ctx, '3. Term and Termination');
  drawParagraph(
    ctx,
    'Employment shall commence on December 1, 2024, and continue until terminated. Either Party may terminate the employment relationship upon six (6) months prior written notice. Company may terminate immediately for "Cause," defined as material breach of this Agreement, willful misconduct, fraud, or conviction of a serious criminal offense.',
  );

  drawHeading(ctx, '4. Intellectual Property Assignment');
  drawParagraph(
    ctx,
    "Executive hereby irrevocably assigns to Company all right, title, and interest in and to any intellectual property created, conceived, developed, or reduced to practice by Executive during the term of employment, whether or not during working hours and whether or not using Company resources, provided such intellectual property relates in any way to the Company's business, research, or development.",
  );

  drawHeading(ctx, '5. Confidentiality');
  drawParagraph(
    ctx,
    "Executive shall hold in strict confidence all Company confidential information, trade secrets, customer lists, business plans, and proprietary technical information, both during and after the term of employment, in perpetuity. Executive shall not use such information for any purpose other than the performance of her duties for the Company.",
  );

  drawHeading(ctx, '6. Non-Compete');
  drawParagraph(
    ctx,
    'During the term of employment and for a period of twenty-four (24) months thereafter, Executive shall not, directly or indirectly, anywhere in the United Kingdom, the European Union, or North America, engage in or assist any business that competes with the Company in the field of autonomous robotics, machine vision, or industrial automation.',
  );

  drawHeading(ctx, '7. Non-Solicitation');
  drawParagraph(
    ctx,
    'During the term of employment and for a period of twelve (12) months thereafter, Executive shall not, directly or indirectly, solicit for employment or hire any employee of the Company, or solicit any customer, supplier, or business partner of the Company to terminate or reduce its business relationship with the Company.',
  );

  drawHeading(ctx, '8. Change of Control');
  drawParagraph(
    ctx,
    'In the event of a Change of Control of the Company during the term of employment, Executive shall be entitled to receive a lump sum severance payment equal to twelve (12) months of base salary if her employment is terminated within twelve (12) months following the Change of Control for any reason other than Cause.',
  );

  drawHeading(ctx, '9. Data Protection');
  drawParagraph(
    ctx,
    'Company shall process Executive personal data in accordance with applicable data protection laws, including the UK GDPR. Executive consents to such processing as is necessary for the performance of this Agreement and the operation of Company HR systems.',
  );

  drawHeading(ctx, '10. Governing Law');
  drawParagraph(
    ctx,
    'This Agreement shall be governed by and construed in accordance with the laws of England and Wales. The Parties submit to the exclusive jurisdiction of the courts of England and Wales for any disputes arising out of this Agreement.',
  );

  return ctx.doc.save();
}

// ── Runner ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const contracts: Array<{
    name: string;
    generator: () => Promise<Uint8Array>;
    note: string;
  }> = [
    {
      name: 'saas-vendor-balanced.pdf',
      generator: saasVendorBalanced,
      note: 'Standard SaaS terms — low/medium risk. Expect ~6–8 clauses, no critical flags.',
    },
    {
      name: 'saas-vendor-risky.pdf',
      generator: saasVendorRisky,
      note: "Aggressive vendor-friendly. Expect critical flags on indemnification (one-sided + unlimited), liability (uncapped), termination (unilateral, 5-day), auto-renewal (180-day notice), non-compete (5 years, worldwide).",
    },
    {
      name: 'nda-mutual.pdf',
      generator: ndaMutual,
      note: 'Short, simple, mostly low risk. Expect 4–6 clauses, all low/medium.',
    },
    {
      name: 'msa-services.pdf',
      generator: msaServices,
      note: 'Larger MSA with 12 clauses. Expect a mix — some low, some medium, balanced overall.',
    },
    {
      name: 'employment-senior.pdf',
      generator: employmentSenior,
      note: 'Executive employment — non-compete + IP assignment + change of control. Expect medium/high on non-compete (24mo, multi-region), IP assignment, perpetual confidentiality.',
    },
  ];

  for (const c of contracts) {
    const bytes = await c.generator();
    const out = join(OUT_DIR, c.name);
    await fs.writeFile(out, bytes);
    console.log(
      `${c.name} — ${(bytes.length / 1024).toFixed(1)} KB\n  ${c.note}\n`,
    );
  }

  console.log(`\nWrote ${contracts.length} contracts to ${OUT_DIR}`);
}

main().catch((err: unknown) => {
  console.error('Failed to generate test contracts:', err);
  process.exit(1);
});
