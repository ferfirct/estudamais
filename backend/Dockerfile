# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --include=dev

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
RUN npm prune --omit=dev

# Stage 2: runtime
FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache libstdc++

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/services/schema.sql ./dist/services/schema.sql

VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3333
ENV DB_PATH=/app/data/estuda.db

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3333/api/health || exit 1

CMD ["node", "dist/server.js"]
