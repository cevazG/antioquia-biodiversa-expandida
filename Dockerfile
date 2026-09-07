# syntax=docker/dockerfile:1

# ── Etapa 1: dependencias de producción ──
FROM node:22-slim AS deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ── Etapa 2: imagen final de ejecución ──
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# curl para el HEALTHCHECK — no viene incluido en node:22-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .

# Directorios de contenido dinámico (fotos subidas por curadores, JSON
# publicados por publicarMes, logs de Winston) — se montan como volúmenes
# nombrados en docker-compose.yml. Se crean vacíos y con dueño "node" aquí
# para que el volumen herede esos permisos la primera vez que Docker lo
# inicializa desde este path (si no, el volumen queda de root y el proceso
# non-root no puede escribir en él).
RUN mkdir -p \
      comunidad/jovenes_pa_lante/img/fotos \
      comunidad/jovenes_pa_lante/data \
      comunidad/guarda_cuencas/img/fotos \
      comunidad/guarda_cuencas/data \
      backend/logs \
    && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "backend/src/index.js"]
