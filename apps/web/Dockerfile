# Next.js app (archiv + SV-intern + admin + API). Build context = monorepo root.
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @sv/db generate
RUN pnpm --filter @sv/web build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bring over the built app plus its installed dependencies (reliable with the
# Prisma engine; simpler than pruning the standalone trace).
COPY --from=build /app ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@sv/web", "exec", "next", "start"]
