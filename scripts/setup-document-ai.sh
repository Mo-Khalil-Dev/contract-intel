#!/usr/bin/env bash
#
# setup-document-ai.sh — one-command Document AI provisioning for the
# ContractIntel OCR pipeline (Phase 7).
#
# What this script does:
#   1. Verifies you're signed in to gcloud and have a project selected
#   2. Enables the Document AI API on the project
#   3. Grants `roles/documentai.apiUser` to the existing uploads service
#      account (the one created by setup-gcs.sh)
#   4. Creates a Document OCR processor in the chosen region (`eu` by default)
#   5. Prints the env vars to paste into apps/backend/.env.local (and Railway)
#
# The pipeline reuses the GCS bucket from setup-gcs.sh for both the source
# PDF (Phase 5 already writes there) and the batch-OCR output prefix
# `gs://{bucket}/ocr/`. No new bucket is created.
#
# Usage:
#   ./scripts/setup-document-ai.sh
#
# All values can be overridden via env vars; defaults match setup-gcs.sh.
# Idempotent — re-running won't duplicate the processor.

set -euo pipefail

# ── Configurable defaults ─────────────────────────────────────────────────
: "${PROJECT_ID:=$(gcloud config get-value project 2>/dev/null || true)}"
: "${LOCATION:=eu}"                                       # Document AI region
: "${PROCESSOR_DISPLAY_NAME:=contractintel-ocr}"
: "${SERVICE_ACCOUNT_NAME:=contractintel-uploads-sa}"     # reuses setup-gcs.sh
: "${BUCKET_NAME:=}"                                      # required — must match setup-gcs.sh

# ── Helpers ───────────────────────────────────────────────────────────────
red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
cyan()   { printf "\033[36m%s\033[0m\n" "$*"; }
step()   { printf "\n\033[36m▸ %s\033[0m\n" "$*"; }

bail() { red "✗ $*"; exit 1; }

# ── Sanity checks ─────────────────────────────────────────────────────────
step "1. Sanity-check gcloud auth + project"
gcloud auth list --filter='status:ACTIVE' --format='value(account)' | grep -q '@' \
  || bail "Not authenticated. Run: gcloud auth login"

[[ -n "$PROJECT_ID" ]] || bail "No project selected. Run: gcloud config set project <id>"

if [[ -z "$BUCKET_NAME" ]]; then
  yellow "BUCKET_NAME not set — falling back to GCS_BUCKET_NAME from environment."
  : "${BUCKET_NAME:=${GCS_BUCKET_NAME:-}}"
fi
[[ -n "$BUCKET_NAME" ]] || bail "BUCKET_NAME is required. Set it to the bucket created by setup-gcs.sh."

green "✓ gcloud OK — project=$PROJECT_ID location=$LOCATION bucket=$BUCKET_NAME"

# ── 2. Enable Document AI API ─────────────────────────────────────────────
step "2. Enable Document AI API"
gcloud services enable documentai.googleapis.com --project="$PROJECT_ID"
green "✓ documentai.googleapis.com enabled"

# ── 3. Grant role to existing service account ─────────────────────────────
step "3. Grant roles/documentai.apiUser to $SERVICE_ACCOUNT_NAME"
SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
  bail "Service account $SA_EMAIL not found. Run setup-gcs.sh first."
fi

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/documentai.apiUser" \
  --condition=None \
  >/dev/null
green "✓ ${SA_EMAIL} can now call Document AI"

# ── 4. Create OCR processor ───────────────────────────────────────────────
step "4. Create Document AI OCR processor"

# Document AI's `gcloud documentai` commands aren't in stable yet — go via REST.
ACCESS_TOKEN=$(gcloud auth print-access-token)
PARENT="projects/${PROJECT_ID}/locations/${LOCATION}"

EXISTING=$(curl -sS \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "https://${LOCATION}-documentai.googleapis.com/v1/${PARENT}/processors" \
  | grep -o "\"displayName\": \"${PROCESSOR_DISPLAY_NAME}\"" || true)

if [[ -n "$EXISTING" ]]; then
  yellow "Processor '$PROCESSOR_DISPLAY_NAME' already exists — skipping creation"
  PROCESSOR_RESPONSE=$(curl -sS \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "https://${LOCATION}-documentai.googleapis.com/v1/${PARENT}/processors")
else
  PROCESSOR_RESPONSE=$(curl -sS -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"displayName\":\"${PROCESSOR_DISPLAY_NAME}\",\"type\":\"OCR_PROCESSOR\"}" \
    "https://${LOCATION}-documentai.googleapis.com/v1/${PARENT}/processors")
  green "✓ processor created"
fi

PROCESSOR_NAME=$(printf '%s' "$PROCESSOR_RESPONSE" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
procs = data.get('processors', [data]) if 'processors' in data else [data]
for p in procs:
    if p.get('displayName') == '${PROCESSOR_DISPLAY_NAME}':
        print(p['name'])
        break
")

[[ -n "$PROCESSOR_NAME" ]] || bail "Could not resolve processor name from API response"
PROCESSOR_ID="${PROCESSOR_NAME##*/}"
green "✓ processor: $PROCESSOR_NAME"

# ── 5. Output env vars ────────────────────────────────────────────────────
step "5. Done — env vars for apps/backend/.env.local"
cat <<EOF

  OCR_DRIVER=google-document-ai
  OCR_GCP_PROJECT_ID=${PROJECT_ID}
  OCR_GCP_LOCATION=${LOCATION}
  OCR_GCP_PROCESSOR_ID=${PROCESSOR_ID}
  OCR_GCP_BATCH_OUTPUT_PREFIX=gs://${BUCKET_NAME}/ocr

Paste those into apps/backend/.env.local (and Railway / production env).

EOF
green "All done. Pipeline will route scanned pages through Document AI on next boot."
