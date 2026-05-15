# syntax=docker/dockerfile:1.6
# Frontend Dockerfile for Railway.
#
# Two stages: a Node build stage that produces apps/frontend/dist via Vite,
# and a tiny static-serve stage. `serve` is installed globally in the
# runtime image so cold starts don't have to npx-fetch it.

FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Manifests first for caching
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/

RUN npm install --legacy-peer-deps

# Source
COPY apps/frontend ./apps/frontend
COPY tsconfig.base.json* ./

# Build (tsc + vite build) — VITE_API_URL is injected as a build-time env
# var by Railway because Vite inlines it at build time.
ARG VITE_API_URL
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST

WORKDIR /app/apps/frontend
RUN npm run build

# ---- runtime image ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/apps/frontend/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# `-s` enables SPA fallback (serve index.html for unknown routes).
CMD ["sh", "-c", "serve dist -s -l $PORT"]
