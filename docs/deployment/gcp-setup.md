# GCP setup for document uploads

The document-upload feature uses **Google Cloud Storage** for prod / Railway and **local filesystem** for dev. This doc gets you from "no GCP account" to "real bucket provisioned, uploads working".

Time required: ~15 minutes the first time. ~30 seconds every other time (just re-run the script).

---

## 1. Sign up for GCP

If you don't already have an account:

1. Go to **https://cloud.google.com/free** and click *Get started for free*.
2. Sign in with a Google account.
3. Provide a card — **Google won't auto-charge** when the free credit runs out; you have to manually upgrade. You get **$300 in credits over 90 days**. The whole document-upload feature costs cents-per-month.
4. You'll land in the Cloud Console.

## 2. Create a project

A *project* is GCP's billing/permissions unit. One project per app you build is the norm.

1. Top bar → project picker → **New project**.
2. Name: `contractintel-prod` (or whatever you like; it doesn't have to be globally unique, but the auto-generated `project ID` does).
3. Note the **Project ID** — that's what goes into env vars.
4. Click **Create**, wait ~30 seconds.

## 3. Install the `gcloud` CLI (one-off)

```bash
# macOS (Homebrew):
brew install --cask google-cloud-sdk

# Linux / others: https://cloud.google.com/sdk/docs/install
```

Verify:
```bash
gcloud --version
```

## 4. Sign in + select the project

```bash
gcloud auth login              # opens a browser, signs you in
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default login   # creates Application Default Credentials
```

The second `auth login` is so the GCS SDK can talk to GCP from your dev machine without juggling service account keys locally.

## 5. Run the provisioning script

From the repo root:

```bash
./scripts/setup-gcs.sh
```

The script will:
1. Verify preflight (signed in, project set)
2. Enable the Cloud Storage API
3. Create a bucket (default: `contractintel-uploads-<random>`)
4. Configure CORS for `http://localhost:5173`
5. Create a service account scoped to this bucket only
6. Grant `roles/storage.objectAdmin` on the bucket to the service account
7. Download a JSON key to `~/contractintel-gcs-key.json`
8. Print the env vars to paste into `apps/backend/.env.local`

If you want a non-default bucket name or region, set them via env first:

```bash
BUCKET_NAME=my-cool-bucket LOCATION=us-central1 ./scripts/setup-gcs.sh
```

## 6. Paste env vars + restart the backend

The script prints something like:

```
STORAGE_DRIVER=gcs
GCS_PROJECT_ID=contractintel-prod
GCS_BUCKET_NAME=contractintel-uploads-12345
GCS_SERVICE_ACCOUNT_KEY=/Users/you/contractintel-gcs-key.json
```

Paste those into `apps/backend/.env.local`. Restart the backend:

```bash
cd apps/backend && npm run dev
```

Watch the boot log — you should see:
```
[GcsStorageDriver] [GcsStorage] initialised. project=contractintel-prod bucket=contractintel-uploads-12345
```

If you see `GCS_CONFIG_MISSING`, one of the env vars didn't land. Double-check.

## 7. Verify with a real upload

1. Open `http://localhost:5173/v2`, log in
2. Click **+ Upload**, pick a PDF, tick consent, click Analyze
3. The browser PUTs directly to `https://storage.googleapis.com/<bucket>/<documentId>.pdf` (you'll see this in the Network tab)
4. Verify the file landed:
   ```bash
   gcloud storage ls gs://YOUR_BUCKET_NAME/
   ```

## Costs

Cloud Storage pricing for a typical small ContractIntel workload:
- Storage: $0.020 / GB / month (Standard, multi-regional)
- Egress to internet: free up to 1 GB/month, then $0.12/GB
- PUT operations: $0.05 per 10,000

Realistically: $0–$1/month for any reasonable demo / personal use. Your $300 free credit covers years.

## Cleaning up

If you want to remove everything:

```bash
gcloud storage rm -r gs://YOUR_BUCKET_NAME
gcloud iam service-accounts delete contractintel-uploads-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Or to nuke the whole project: Cloud Console → **IAM & Admin** → **Settings** → **Shut Down**.

## Troubleshooting

**`Permission denied` on `gs://...` after setup:**
Wait 30 seconds and try again. IAM bindings can take that long to propagate.

**`Bucket not found` from the backend:**
`GCS_BUCKET_NAME` is misspelled in `.env.local`, or the bucket was deleted.

**`Could not load default credentials` from the SDK:**
Either set `GCS_SERVICE_ACCOUNT_KEY` to the path / base64 of your key, or run `gcloud auth application-default login`.

**CORS error from the browser when PUTting:**
The bucket's CORS allows `http://localhost:5173` only by default. If you're testing from a different origin (e.g. a Vercel preview), re-run the script with `FRONTEND_ORIGIN=https://your-other-origin.com ./scripts/setup-gcs.sh` to add it.

---

## Phase 7 — Document AI for OCR

Once GCS is working (Phase 5), Phase 7's OCR pipeline can optionally use **Google Document AI** for scanned PDFs. Born-digital PDFs (Word → Save as PDF, etc.) still go through pdfjs locally and cost nothing. Only scanned/image-only pages route through Document AI.

### Cost

- Document OCR processor: **$1.50 / 1,000 pages** for the first 1M pages/month, $0.60/k after.
- Realistic mix at 1,000 docs/day (70 % born-digital, 25 % hybrid w/ 5 scanned pages, 5 % fully scanned 100 pages) ≈ **$10/day ≈ $285/month**.
- Worst case (every doc is 200 scanned pages) ≈ $300/day. The pipeline's 200-page cap is the cost ceiling.

### One-shot provisioning

```bash
BUCKET_NAME=<your-bucket-from-setup-gcs.sh> ./scripts/setup-document-ai.sh
```

The script:
1. Enables the Document AI API on your project.
2. Grants `roles/documentai.apiUser` to the existing `contractintel-uploads-sa` service account.
3. Creates an OCR processor named `contractintel-ocr` in `eu`.
4. Prints the four env vars you need.

The processor and the GCS bucket reuse one service account — same JSON key.

### Env vars

Paste into `apps/backend/.env.local` (and Railway):

```
OCR_DRIVER=google-document-ai
OCR_GCP_PROJECT_ID=your-project-id
OCR_GCP_LOCATION=eu
OCR_GCP_PROCESSOR_ID=abc123xyz                  # printed by the script
OCR_GCP_BATCH_OUTPUT_PREFIX=gs://your-bucket/ocr  # reuses your existing bucket
```

Leave `OCR_DRIVER=mock` (the default) for local dev without OCR costs; the pipeline still runs end-to-end, just with fixture text for scanned pages.

### Sync vs batch

- **Sync** (`processDocument`): ≤15 pages and ≤20 MB. Used automatically when the page hint + byte hint fit. Single call, response in 1–3 s/page.
- **Batch** (`batchProcessDocuments`): everything else. Driver uploads the source PDF to `gs://{bucket}/ocr/input/{documentId}.pdf`, kicks off a long-running operation, polls until complete, then reads per-shard JSON results back from `gs://{bucket}/ocr/output/{documentId}/{timestamp}/`. Slower (10–30 s startup + 0.5–2 s/page) but no hard page cap below our 200 limit.

The driver picks automatically using the `pageCountHint` and `byteSizeHint` the orchestrator passes through. No env knob.

### Troubleshooting

**`PERMISSION_DENIED` from Document AI:**
The service account is missing `roles/documentai.apiUser`. Re-run `setup-document-ai.sh`.

**`RESOURCE_EXHAUSTED` (quota):**
Default Document AI quota is 1,800 pages/min. Above that the pipeline retries with the 1s/4s/16s backoff. Sustained bursts need a quota bump from the Cloud Console.

**Batch job finishes but the pipeline says `empty_batch_output`:**
The output prefix is wrong. `OCR_GCP_BATCH_OUTPUT_PREFIX` must be a `gs://bucket/prefix` URI the service account can write *and* list. Test with `gcloud storage ls gs://your-bucket/ocr/`.

**`unsupported_language:fr`:**
A non-English contract was detected up front. v1 is English-only; the language allowlist lives in `LanguageDetector` (extending it means appending to `SUPPORTED_LANGUAGES` and seeding a wordlist).

---

Next: see [`railway.md`](./railway.md) for deploying with these credentials.
