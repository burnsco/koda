FROM oven/bun:1.3.10 AS deps
WORKDIR /app

COPY frontend/package.json ./package.json
RUN bun install

FROM oven/bun:1.3.10 AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY frontend ./

ARG NEXT_PUBLIC_BACKEND_HTTP_URL=http://localhost:8080
ARG NEXT_PUBLIC_BACKEND_WS_URL=ws://localhost:8080

ENV NEXT_PUBLIC_BACKEND_HTTP_URL=${NEXT_PUBLIC_BACKEND_HTTP_URL}
ENV NEXT_PUBLIC_BACKEND_WS_URL=${NEXT_PUBLIC_BACKEND_WS_URL}

RUN bun run build

FROM oven/bun:1.3.10-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

USER bun

COPY --from=build --chown=bun:bun /app/.next/standalone ./
COPY --from=build --chown=bun:bun /app/public ./public
COPY --from=build --chown=bun:bun /app/.next/static ./.next/static

EXPOSE 3000
CMD ["bun", "server.js"]
