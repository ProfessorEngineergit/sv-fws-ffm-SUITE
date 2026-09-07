# Smart-mail worker (IMAP → OpenAI → route → Slack → escalate).
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @sv/db generate

ENV NODE_ENV=production
# The worker only needs to read its own code — run it unprivileged.
RUN chown -R node:node /app
USER node
CMD ["pnpm", "--filter", "@sv/mail-brain", "exec", "tsx", "src/index.ts"]
