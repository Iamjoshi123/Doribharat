# syntax=docker/dockerfile:1

FROM node:20-slim AS base
WORKDIR /app

ENV NODE_ENV=production

FROM base AS deps
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM deps AS build
ENV NODE_ENV=development
COPY tsconfig.json tsconfig.server.json ./
COPY server ./server
RUN npm run build:server

FROM deps AS prune
RUN npm prune --omit=dev

FROM base AS runner
WORKDIR /app
COPY --from=prune /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./package.json

USER node
EXPOSE 8080

CMD ["node", "dist/index.js"]
