# Koda Backend (Zig)

Realtime backend scaffold with in-memory room/chat/stream/voice state.

## Run

```bash
make backend
```

## Environment

- `KODA_HOST` (default: `0.0.0.0`)
- `KODA_PORT` (default: `8080`)
- `KODA_CORS_ORIGIN` (default: `http://localhost:3000`)
- `KODA_MEDIA_RTMP_BASE_URL` (default: `rtmp://localhost:1935/live`)
- `KODA_MEDIA_HLS_BASE_URL` (default: `http://localhost:8888/live`)

## Routes

- `GET /health`
- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/messages?room_id=<id>`
- `POST /api/messages`
- `GET /api/streams`
- `POST /api/streams` (returns `obs.server_url`, `obs.stream_key`, `obs.ingest_url`)
- `POST /api/streams/stop`
- `GET /ws/chat` (WebSocket upgrade)
- `GET /ws/signal` (WebSocket upgrade for WebRTC signaling)

## Notes

- Persistence is in-memory only right now.
- Streams are OBS-compatible via RTMP ingest and HLS playback URLs.
- WebSocket clients publish plain text frames.
- Broadcast events are JSON objects with message metadata.
- Signal websocket accepts JSON payloads and rebroadcasts room events for peer negotiation.
