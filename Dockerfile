# syntax=docker/dockerfile:1.7

# Multi-stage build for Next.js 16 (App Router) + pnpm.
# Produces a minimal runtime image based on Next's `output: "standalone"` bundle.

ARG NODE_VERSION=24

# ---------- deps ----------
# Install production + dev deps once, in a layer keyed on the lockfile so
# subsequent source-only changes don't re-run `pnpm install`.
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

# libc6-compat provides a glibc shim some Node native modules expect on Alpine.
RUN apk add --no-cache libc6-compat

# Corepack ships with Node 24; pin pnpm to the version declared in package.json.
RUN corepack enable

# Copy only the files needed to resolve + install dependencies.
# `patches/` is required because pnpm-workspace.yaml references molstar.patch.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches

# BuildKit cache mount keeps the pnpm store warm across builds.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile


# ---------- builder ----------
# Compile the Next.js app. Produces `.next/standalone` and `.next/static`.
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry and build.
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build


# ---------- runner ----------
# Minimal runtime: only the standalone server + static assets + public dir.
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Next's standalone server reads PORT and HOSTNAME at startup.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user. K8s pod securityContext can also enforce this,
# but baking it into the image is defense-in-depth.
# Alpine uses addgroup/adduser instead of groupadd/useradd.
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Standalone output ships its own minimal node_modules, so we don't copy
# the full builder node_modules. This is what makes the final image small.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Standalone emits a top-level server.js entrypoint.
CMD ["node", "server.js"]
