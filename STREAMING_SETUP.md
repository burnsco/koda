# Koda Streaming Setup (Local Dev -> Production)

This guide is specific to this repo and covers:

- local OBS ingest + playback for development
- production deployment with domains, TLS, and reverse proxy

## 1) Local Development Setup

### Prerequisites

- Docker + Docker Compose
- Bun `1.3.10`
- Zig `0.15.2`
- OBS Studio

### Start media server (RTMP ingest + HLS playback)

```bash
cd /home/cburns/apps/punch
docker compose up -d media
```

### Start backend + frontend (local dev)

```bash
make install
make dev
```

Expected endpoints (or next available ports if occupied):

- frontend: `http://localhost:3000`
- backend: `http://localhost:8080`
- RTMP ingest: `rtmp://localhost:1935/live`
- HLS playback base: `http://localhost:8888/live`

### In-app stream setup

1. Sign in.
2. Enter a `stream` room.
3. Set stream title.
4. Enter OBS server and stream key in the stream panel (or leave defaults).
5. Click `Go Live (OBS)`.
6. Confirm playback URL appears and stream status is live.

### OBS setup

1. Open `Settings -> Stream`.
2. Set `Service` to `Custom...`.
3. Paste:
   - `Server`: value from stream panel (example: `rtmp://localhost:1935/live`)
   - `Stream Key`: value from stream panel
4. Click `Start Streaming`.

Playback URL format:

```text
http://localhost:8888/live/<stream-key>/index.m3u8
```

## 2) Production Setup

Production files added:

- `docker-compose.prod.yml`
- `infra/Caddyfile`
- `.env.prod.example`

### DNS plan

Create DNS records:

- `app.example.com` -> host running `docker-compose.prod.yml`
- `api.example.com` -> same host
- `play.example.com` -> same host
- `ingest.example.com` -> same host

### Environment file

Create `.env.prod` from `.env.prod.example` and set real values.

Required variables:

- `APP_DOMAIN`
- `API_DOMAIN`
- `PLAY_DOMAIN`
- `INGEST_DOMAIN`
- `LETSENCRYPT_EMAIL`

### Start production stack

```bash
cd /home/cburns/apps/punch
cp .env.prod.example .env.prod
# edit .env.prod with real domains/email
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

### What each domain serves

- `https://$APP_DOMAIN` -> frontend
- `https://$API_DOMAIN` -> backend REST + WebSocket
- `https://$PLAY_DOMAIN` -> MediaMTX HLS playback
- `rtmp://$INGEST_DOMAIN:1935/live` -> OBS ingest

OBS production server example:

```text
rtmp://ingest.example.com:1935/live
```

### Port requirements

- `80/tcp` and `443/tcp` (Caddy TLS + HTTPS)
- `1935/tcp` (RTMP ingest from OBS)

### Production verification checklist

1. `https://$APP_DOMAIN` loads.
2. Login works.
3. `Go Live (OBS)` returns a server URL + stream key.
4. OBS connects and stays connected.
5. Playback URL `https://$PLAY_DOMAIN/live/<stream-key>/index.m3u8` is reachable.
6. Viewers in stream room can play video.

## 3) Common Issues

- `401` when starting stream: missing/expired auth session.
- OBS connect failure: `1935/tcp` blocked or wrong RTMP server URL.
- Player stays blank:
  - no active OBS publish yet
  - wrong stream key
  - playback domain/base URL mismatch (`KODA_MEDIA_HLS_BASE_URL`)

## 4) Security and Ops Notes

- The backend store is in-memory; restart clears rooms/messages/streams/users.
- Pin image tags in production (already pinned for `media` and `proxy`).
- For real deployments, add persistent storage and stronger stream authorization rules.
