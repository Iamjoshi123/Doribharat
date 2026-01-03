# syntax=docker/dockerfile:1

FROM node:20-slim AS base
WORKDIR /app

# Step 1: Install ALL dependencies (including devDependencies like TypeScript)
FROM base AS deps
ENV NODE_ENV=development
COPY package*.json ./
# Ensure devDependencies are installed so TypeScript is available for the build
RUN npm install --production=false

FROM deps AS build
# Step 2: Copy source and build
COPY tsconfig.json tsconfig.server.json ./
COPY server ./server
RUN npm run build:server

FROM deps AS prune
# Step 3: Now remove devDependencies to keep the final image small
RUN npm prune --omit=dev

FROM base AS runner
WORKDIR /app
# Set production environment for the actual execution
ENV NODE_ENV=production

COPY --from=prune /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./package.json

USER node
EXPOSE 8080

CMD ["node", "dist/index.js"]
