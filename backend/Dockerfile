# Build stage
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

RUN npm run build
RUN npm prune --omit=dev

# Runtime stage
FROM node:20-slim AS runner
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 8080
USER appuser
CMD ["node", "dist/index.js"]
