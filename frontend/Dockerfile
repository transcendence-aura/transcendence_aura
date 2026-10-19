# --- Stage 1 : Dependencies ---

FROM docker.io/library/node:24-alpine AS deps
# Add missing glibc symbols required by some native Node modules
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# Use --ignore-scripts to prevent Husky from failing due to missing .git folder
RUN npm ci --ignore-scripts

# --- Stage 2 : Builder ---
FROM docker.io/library/node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Stage 3 : Runner ---
FROM docker.io/library/node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security compliance
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy the minimal standalone Next.js server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy required static assets (not included in standalone output)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
# bind to 0.0.0.0 to ensure the container is accessible from the outside network
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
