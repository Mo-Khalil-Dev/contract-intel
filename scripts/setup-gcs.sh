#!/usr/bin/env bash
#
# setup-gcs.sh — one-command Google Cloud Storage provisioning for the
# ContractIntel document-upload feature.
#
# What this script does:
#   1. Verifies you're signed in to gcloud and have a project selected
#   2. Enables Cloud Storage API on the project
#   3. Creates a bucket (regional, public-access prevention ON)
#   4. Configures CORS on the bucket for your frontend origin
#   5. Creates a service account scoped to that bucket only
#   6. Grants roles/storage.objectAdmin on the bucket to the service account
#   7. Downloads the service account JSON key
#   8. Prints the env vars to paste into apps/backend/.env.local (and Railway)
#
# Usage:
#   ./scripts/setup-gcs.sh
#
# All values can be overridden via env vars; defaults are sensible.
# See docs/deployment/gcp-setup.md for the GCP sign-up walkthrough that
# gets you to the point where you can run this.

set -euo pipefail

# ── Configurable defaults ─────────────────────────────────────────────────
: "${PROJECT_ID:=$(gcloud config get-value project 2>/dev/null || true)}"
: "${BUCKET_NAME:=contractintel-uploads-${RANDOM}${RANDOM}}"
: "${LOCATION:=europe-west2}"              # London — change for your region
: "${SERVICE_ACCOUNT_NAME:=contractintel-uploads-sa}"
: "${KEY_OUTPUT:=$HOME/contractintel-gcs-key.json}"
: "${FRONTEND_ORIGIN:=http://localhost:5173}"

# ── Helpers ───────────────────────────────────────────────────────────────
red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
cyan()   { printf "\033[36m%s\033[0m\n" "$*"; }
step()   { printf "\n\033[36m▸ %s\033[0m\n" "$*"; }

bail() {
  red "✗ $*"
  exit 1
}

# ── Preflight ─────────────────────────────────────────────────────────────
step "Preflight checks"

command -v gcloud >/dev/null 2>&1 || bail "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
  bail "Not signed in. Run: gcloud auth login"
fi

if [[ -z "$PROJECT_ID" ]]; then
  bail "No GCP project selected. Run: gcloud config set project YOUR_PROJECT_ID"
fi

green "✓ gcloud signed in as $(gcloud config get-value account)"
green "✓ Project: $PROJECT_ID"
green "✓ Region:  $LOCATION"
green "✓ Bucket:  $BUCKET_NAME (will be created)"

read -r -p "Proceed? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || bail "Aborted by user"

# ── 1. Enable the Cloud Storage API ───────────────────────────────────────
step "Enabling Cloud Storage API"
gcloud services enable storage.googleapis.com --project="$PROJECT_ID"
green "✓ API enabled"

# ── 2. Create the bucket ──────────────────────────────────────────────────
step "Creating bucket gs://$BUCKET_NAME"
if gcloud storage buckets describe "gs://$BUCKET_NAME" >/dev/null 2>&1; then
  yellow "  bucket already exists — skipping create"
else
  gcloud storage buckets create "gs://$BUCKET_NAME" \
    --project="$PROJECT_ID" \
    --location="$LOCATION" \
    --public-access-prevention \
    --uniform-bucket-level-access
  green "✓ Bucket created"
fi

# ── 3. Configure CORS ─────────────────────────────────────────────────────
step "Configuring CORS for $FRONTEND_ORIGIN"
CORS_JSON=$(mktemp)
cat > "$CORS_JSON" <<EOF
[
  {
    "origin": ["$FRONTEND_ORIGIN"],
    "method": ["PUT", "GET", "HEAD"],
    "responseHeader": ["Content-Type", "Content-Length", "ETag"],
    "maxAgeSeconds": 3600
  }
]
EOF
gcloud storage buckets update "gs://$BUCKET_NAME" --cors-file="$CORS_JSON"
rm "$CORS_JSON"
green "✓ CORS configured"

# ── 4. Create the service account ─────────────────────────────────────────
step "Creating service account $SERVICE_ACCOUNT_NAME"
SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  yellow "  service account already exists — skipping create"
else
  gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
    --project="$PROJECT_ID" \
    --display-name="ContractIntel Uploads"
  green "✓ Service account created: $SA_EMAIL"
fi

# ── 5. Grant bucket-scoped object admin ───────────────────────────────────
step "Granting bucket-scoped storage.objectAdmin"
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin" >/dev/null
green "✓ IAM bound (bucket-scoped, not project-wide)"

# ── 6. Download the key ───────────────────────────────────────────────────
step "Downloading service account key to $KEY_OUTPUT"
if [[ -f "$KEY_OUTPUT" ]]; then
  yellow "  $KEY_OUTPUT already exists — skipping (delete to re-download)"
else
  gcloud iam service-accounts keys create "$KEY_OUTPUT" \
    --iam-account="$SA_EMAIL" \
    --project="$PROJECT_ID"
  chmod 600 "$KEY_OUTPUT"
  green "✓ Key downloaded (file mode 600)"
fi

# ── 7. Print env vars ─────────────────────────────────────────────────────
step "Env vars to paste into apps/backend/.env.local"

# Base64 encode for env-var-friendly transport (Railway dashboard, etc.)
KEY_BASE64=$(base64 < "$KEY_OUTPUT" | tr -d '\n')

cyan "──────────────────── apps/backend/.env.local ────────────────────"
echo "STORAGE_DRIVER=gcs"
echo "GCS_PROJECT_ID=$PROJECT_ID"
echo "GCS_BUCKET_NAME=$BUCKET_NAME"
echo "# For local dev (file path option — points at the downloaded key):"
echo "GCS_SERVICE_ACCOUNT_KEY=$KEY_OUTPUT"
echo "#"
echo "# For Railway / Cloud (base64 option — copy from line below):"
echo "# GCS_SERVICE_ACCOUNT_KEY=$KEY_BASE64"
cyan "─────────────────────────────────────────────────────────────────"

green ""
green "✓ All done. Next steps:"
green "  • Paste the env vars above into apps/backend/.env.local"
green "  • Restart the backend  (npm run dev)"
green "  • Verify by inspecting the boot log for: 'GcsStorage initialised. project=...'"
green "  • For Railway: copy the same vars into the Railway dashboard"
green "    (use the base64 version of GCS_SERVICE_ACCOUNT_KEY)"
green ""
green "  See docs/deployment/railway.md for the Railway-specific steps."
