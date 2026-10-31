FROM node:22-slim AS base
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

# Copy dependency manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @readyon/server... --filter @readyon/shared...

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Generate Prisma client
WORKDIR /app/apps/server
RUN pnpm exec prisma generate

EXPOSE 3000
CMD ["pnpm", "run", "dev"]
