# Koda

Koda is a Twitch and Discord-inspired app scaffold with a Zig backend and Next.js frontend. It covers chat, rooms, and streaming-oriented real-time features.

## Repo layout

- `backend/`: Zig API and WebSocket services
- `frontend/`: Next.js app
- `docker-compose` stack for full local runs

## Stack

- Zig
- Next.js
- React
- Bun

## Quick start

```bash
make run
```

For local development without the full Docker flow:

```bash
make install
make run-local
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
