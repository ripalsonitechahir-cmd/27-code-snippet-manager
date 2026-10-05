# ---- Stage 1: build the React frontend ----
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: runtime (API + built UI) ----
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
ENV NODE_ENV=production PORT=4000 DATABASE_URL=file:/data/app.db

COPY backend/package*.json ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# SQLite lives in /data (mounted as a volume); run as non-root
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME /data
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fs http://localhost:4000/health || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
