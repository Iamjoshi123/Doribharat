# syntax=docker/dockerfile:1

# --- Stage 1: Build Frontend (Vite) ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
# Copy root package.json for potential shared deps, but mostly focused on frontend
COPY package*.json ./
RUN npm install
COPY . .
# Build the React app (output usually to dist/)
RUN npm run build

# --- Stage 2: Build Backend ---
FROM node:20-slim AS backend-builder
WORKDIR /app/backend
COPY package*.json tsconfig.json ./
# FIXED: Copy src instead of server
COPY src ./src
COPY prisma ./prisma
RUN npm install
# FIXED: Run prisma generate and build
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# --- Stage 3: Runner ---
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy backend dependencies and build
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package.json ./package.json
COPY --from=backend-builder /app/backend/prisma ./prisma

# Copy frontend build to a public directory served by Express
COPY --from=frontend-builder /app/frontend/dist ./public

USER node
EXPOSE 8080

CMD ["node", "dist/index.js"]
