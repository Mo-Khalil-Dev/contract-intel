# Railway deployment

Quick reference for getting ContractIntel running on Railway with real GCS uploads.

Assumes you already have:
- A Railway account + CLI installed (`brew install railwayapp/railway/railway`)
- A GCS bucket + service account set up (see [`gcp-setup.md`](./gcp-setup.md))
- The repo connected to a Railway project (or you're about to)

---

## Services Railway needs

ContractIntel deploys as **two services**:

| Service | What | Source |
|---|---|---|
| `backend` | NestJS API | `apps/backend` |
| `frontend` | Vite static build | `apps/frontend` |

Plus one **plugin**:

| Plugin | What |
|---|---|
| `PostgreSQL` | Database (Railway's managed Postgres) |

Add the plugin via the Railway dashboard → *New* → *Database* → *Add PostgreSQL*. Railway auto-populates `DATABASE_URL` into the backend service.

> **Note on Postgres vs SQLite.** Local dev uses SQLite (the `dev.db` file). Railway uses real Postgres. **You'll need to swap the Prisma datasource** before deploying:
> ```diff
>   datasource db {
> -   provider = "sqlite"
> +   provider = "postgresql"
>     url      = env("DATABASE_URL")
>   }
> ```
> Run `npx prisma migrate dev --name init_postgres` against the Railway DB to generate the Postgres-flavoured migration. Keep SQLite for local. (A small upgrade-script in the repo will land in a follow-up; for now this is manual.)

---

## Env vars per service

### `backend` service

Open the service in the Railway dashboard → *Variables* tab. Add:

```
NODE_ENV=production
API_PREFIX=api/v1
PORT=3000

# Database — Railway sets DATABASE_URL automatically when the Postgres
# plugin is attached. Don't override unless you know what you're doing.

# Frontend — used for CORS and the post-login redirect.
FRONTEND_URL=https://your-frontend.up.railway.app
CORS_ORIGIN=https://your-frontend.up.railway.app

# Auth — same Auth0 tenant you use locally, OR a separate prod tenant.
AUTH0_DOMAIN=dev-mk-xubo1eltr6n4b4ze.uk.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_CALLBACK_URL=https://your-frontend.up.railway.app/auth/callback

# Session
SESSION_SECRET=<generate fresh, e.g. openssl rand -hex 32>
ENCRYPTION_KEY=<generate fresh, e.g. openssl rand -hex 32>
ENCRYPTION_KEY_NAME=default

# Storage — the new bit for Task 5.4b.
STORAGE_DRIVER=gcs
GCS_PROJECT_ID=contractintel-prod
GCS_BUCKET_NAME=contractintel-uploads-12345
# Base64 of the JSON service account key. The setup-gcs.sh script prints
# this value at the end — copy the long string after the comment line.
GCS_SERVICE_ACCOUNT_KEY=<paste base64 here>
```

### `frontend` service

```
VITE_API_URL=https://your-backend.up.railway.app/api/v1
VITE_AUTH0_DOMAIN=dev-mk-xubo1eltr6n4b4ze.uk.auth0.com
VITE_AUTH0_CLIENT_ID=...
VITE_AUTH0_CALLBACK_URL=https://your-frontend.up.railway.app/auth/callback
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://eu.i.posthog.com
```

---

## Service config

### `backend` build / start

In *Settings* → *Deploy*:

- **Root directory**: `/`
- **Build command**: `npm install --legacy-peer-deps && npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma && npm run build --workspace=contract-intel-backend`
- **Start command**: `npm run start --workspace=contract-intel-backend`

The `prisma migrate deploy` step applies any pending migrations on each deploy (idempotent — does nothing if the DB is up to date).

### `frontend` build / start

- **Root directory**: `/`
- **Build command**: `npm install --legacy-peer-deps && npm run build --workspace=contract-intel-frontend`
- **Start command**: Railway auto-detects Vite. If not, use `npm run preview --workspace=contract-intel-frontend -- --host 0.0.0.0 --port $PORT`.

For production, you almost certainly want a real static host (Vercel/Netlify/Cloudflare Pages) for the frontend rather than Railway. Same env vars apply.

---

## Auth0 callback config

Once you have your Railway domain:

1. Go to Auth0 dashboard → *Applications* → your app
2. *Allowed Callback URLs*: add `https://your-frontend.up.railway.app/auth/callback`
3. *Allowed Logout URLs*: add `https://your-frontend.up.railway.app`
4. *Allowed Web Origins*: add `https://your-frontend.up.railway.app`

If you skip this you'll get an `Invalid redirect_uri` error on first login.

---

## CORS on the GCS bucket

`scripts/setup-gcs.sh` configures the bucket to accept PUTs from `http://localhost:5173`. For production:

```bash
FRONTEND_ORIGIN=https://your-frontend.up.railway.app ./scripts/setup-gcs.sh
```

This re-applies the CORS rules including your production origin. Re-running the script is safe — it skips bucket/service account creation if those already exist.

If you want to allow *both* origins (dev + prod):
```bash
gcloud storage buckets update gs://YOUR_BUCKET --cors-file=cors.json
```
with `cors.json` containing both origins in the `origin` array.

---

## Verification after deploy

1. Visit `https://your-frontend.up.railway.app/v2`
2. Log in (will redirect through Auth0)
3. Click **+ Upload**, pick a PDF, tick consent, click Analyze
4. In DevTools → Network, you should see:
   - `POST /api/v1/documents/upload/initiate` → 201 with `uploadUrl: https://storage.googleapis.com/...`
   - `PUT https://storage.googleapis.com/...` → 200
   - `POST /api/v1/documents/upload/complete` → 204
5. Check the bucket: `gcloud storage ls gs://YOUR_BUCKET/`

---

## Troubleshooting

**Backend boot fails with `GCS_CONFIG_MISSING`:**
One of `GCS_PROJECT_ID`, `GCS_BUCKET_NAME`, or `GCS_SERVICE_ACCOUNT_KEY` is missing or empty in the Railway variables. Re-check.

**Backend boot fails with `Could not load default credentials`:**
`GCS_SERVICE_ACCOUNT_KEY` is set but isn't valid base64. Run `base64 < your-key.json | tr -d '\n'` and paste the result. No quotes, no newlines.

**Upload PUT fails with 403 from GCS:**
Either the bucket CORS doesn't include your production origin (see above), or the service account doesn't have `roles/storage.objectAdmin` on the bucket. Re-run `setup-gcs.sh`.

**Files upload but backend `/complete` 404s:**
Backend can't find the Document row. Either the Prisma migrations didn't run on deploy (check the build log for the `prisma migrate deploy` step), or you're hitting a different backend instance than the one that called `/initiate`. Make sure Railway is running a single backend instance (Settings → Replicas = 1) for v1.
