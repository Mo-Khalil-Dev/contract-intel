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

Next: see [`railway.md`](./railway.md) for deploying with these credentials.
