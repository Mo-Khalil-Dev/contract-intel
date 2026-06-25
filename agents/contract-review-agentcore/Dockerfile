# AgentCore Runtime requires linux/arm64 containers that serve the HTTP
# contract (POST /invocations, GET /ping) on port 8080.
# Build for arm64 explicitly:  docker build --platform linux/arm64 -t <tag> .
FROM node:22-slim

WORKDIR /app

# Install prod deps only (tsx is a prod dep so we run agent.ts directly — no
# build step). npm ci uses the committed lockfile for reproducible installs.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App sources. system_prompt.md must be in the image — the agent reads it at
# startup as the playbook system prompt.
COPY agent.ts system_prompt.md tsconfig.json ./

EXPOSE 8080
CMD ["npx", "tsx", "agent.ts"]
