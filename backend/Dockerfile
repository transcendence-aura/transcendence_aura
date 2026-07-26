# --- Stage 1 : Dependencies ---

FROM node:24-alpine AS deps
# Add missing glibc symbols required by some native Node modules
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# Include Prisma schema & config so the client can be generated
COPY prisma ./prisma/
COPY prisma.config.ts ./
# Use --ignore-scripts to prevent Husky from failing due to missing .git folder
RUN npm ci --ignore-scripts

# --- Stage 2 : Builder ---
FROM node:24-alpine AS build
WORKDIR /app
# devDependencies are required here to run the Nest CLI during build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client using a temporary build-time datasource URL.
# The runtime URL is provided byt the Docker Compose when the container starts.
RUN POSTGRES_URL="postgresql://prisma:prisma@localhost:5432/prisma" \
  npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# --- Stage 3 : Production Dependencies ---
FROM node:24-alpine AS prod-deps
# Add again glibc compatibility for production native modules
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
# Install only production dependencies to minimize the final image size
RUN npm ci --omit=dev --ignore-scripts

# Generate Prisma Client specifically for production node_modules
RUN POSTGRES_URL="postgresql://prisma:prisma@localhost:5432/prisma" \
  npx prisma generate --schema=./prisma/schema.prisma

# --- Stage 4 : Runner ---
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user for security compliance
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

# Copy the isolated production dependencies
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
# Copy the compiled application code
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
# Copy Prisma directory
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --chown=nestjs:nodejs package.json ./

USER nestjs

EXPOSE 3001
ENV PORT=3001

# Launch the compiled NestJS app
CMD ["node", "dist/src/main.js"]
