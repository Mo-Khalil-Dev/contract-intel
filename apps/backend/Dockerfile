# syntax=docker/dockerfile:1.6
# Backend Dockerfile for Railway.
#
# Built from the monorepo root (Railway sets the build context to the repo
# root via RAILWAY_DOCKERFILE_PATH=apps/backend/Dockerfile). We need the root
# package.json + package-lock.json + the workspace package.json files so that
# `npm install` resolves the workspace graph correctly.

FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Install build deps for native modules (e.g. prisma engines)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests first for better layer caching
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/

# Install the full workspace (legacy-peer-deps to match local + railway docs)
RUN npm install --legacy-peer-deps

# Now bring in the source
COPY apps/backend ./apps/backend
COPY tsconfig.base.json* ./

# Generate prisma client + build nest app
WORKDIR /app/apps/backend
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

# ---- runtime image ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the installed node_modules + built artifact + prisma assets
# In an npm workspace install, deps are hoisted to the root node_modules,
# so there's no separate apps/backend/node_modules to copy.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

ENV NODE_ENV=production
# Railway injects PORT; fall back to 3000 for local docker run
ENV PORT=3000
EXPOSE 3000

# Apply pending Prisma migrations against DATABASE_URL (sqlite file on the
# Railway volume) on every boot, then start the Nest app. `migrate deploy`
# is idempotent — a no-op if the DB is already up to date.
WORKDIR /app/apps/backend
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/main.js"]
