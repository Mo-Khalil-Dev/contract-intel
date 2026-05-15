import { promises as fs } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppConfigService } from '../../../../config/app-config.service';
import { validateEnvironment } from '../../../../config/environment-variables';
import { GoogleDocAiDriver } from './google-doc-ai.driver';
import {
  GoogleDocAiGcsHelpers,
  GoogleDocAiSdkClient,
} from './google-doc-ai.adapters';

/**
 * LIVE integration test — calls Google Document AI for real.
 *
 * Gated by `RUN_LIVE_DOCAI=1` so default CI runs skip it. Run locally with:
 *
 *   RUN_LIVE_DOCAI=1 npm test -- --testPathPattern google-doc-ai.live
 *
 * Requires the five OCR_GCP_* env vars from .env.local (provisioned via
 * scripts/setup-document-ai.sh). Costs ~$0.01 per run (7 pages × $0.0015).
 *
 * What's exercised end-to-end:
 *   - Real SDK construction (regional endpoint `eu-documentai.googleapis.com`)
 *   - Real auth via the GCS service account key
 *   - Real sync API call (7 pages fits the ≤15-page sync path)
 *   - Real response → OcrOutput mapping
 *
 * The 7.3 integration test proves the orchestrator + pdfjs path; this
 * test fills in the only piece those couldn't cover: the wire between
 * GoogleDocAiDriver and Google's actual servers.
 */
const FIXTURE = join(
  __dirname,
  '../../../../../test/fixtures/ocr/born-digital-sample.pdf',
);

const describeOrSkip = process.env.RUN_LIVE_DOCAI === '1' ? describe : describe.skip;

describeOrSkip('GoogleDocAiDriver (LIVE)', () => {
  let driver: GoogleDocAiDriver;

  beforeAll(async () => {
    // Boot the same DI graph the real backend uses so config/env validation
    // mirrors production — including the regional API endpoint selection.
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.local',
          validate: validateEnvironment,
        }),
      ],
      providers: [
        AppConfigService,
        GoogleDocAiSdkClient,
        GoogleDocAiGcsHelpers,
        {
          provide: GoogleDocAiDriver,
          inject: [AppConfigService, GoogleDocAiSdkClient, GoogleDocAiGcsHelpers],
          useFactory: (
            cfg: AppConfigService,
            client: GoogleDocAiSdkClient,
            gcs: GoogleDocAiGcsHelpers,
          ) => new GoogleDocAiDriver(cfg, client, gcs),
        },
      ],
    }).compile();
    await moduleRef.init();
    driver = moduleRef.get(GoogleDocAiDriver);
  });

  it('processes a real 7-page PDF via the sync path', async () => {
    const bytes = await fs.readFile(FIXTURE);

    const out = await driver.extractText({
      documentId: 'live-test',
      source: Readable.from([bytes]),
      mimeType: 'application/pdf',
      languages: ['en'],
      pageCountHint: 7,
      byteSizeHint: bytes.length,
    });

    expect(out.driver).toBe('google_document_ai');
    expect(out.pages.length).toBe(7);
    expect(out.text.length).toBeGreaterThan(100);
    expect(out.confidence).toBeGreaterThan(0.85);
    expect(out.language).toBe('en');
    // Log so the run output shows what real Document AI returns for
    // confidence — useful for tuning OCR_CONF_THRESHOLD later.
    // eslint-disable-next-line no-console
    console.log(
      `[LIVE] pages=${out.pages.length} confidence=${out.confidence.toFixed(4)} minPage=${out.minPageConfidence.toFixed(4)} sample="${out.pages[0].text.slice(0, 80).replace(/\s+/g, ' ')}"`,
    );
  }, 60_000);
});
