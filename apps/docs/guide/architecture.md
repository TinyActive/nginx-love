# Architecture

Nginx Love runs as a multi-container stack orchestrated by Docker Compose.

## Components

| Service | Role | Port (host) |
|---------|------|-------------|
| **frontend** | React admin UI + nginx reverse proxy to API | 8080 |
| **backend** | Express API + nginx + ModSecurity + JA4 module | 80/443 (internal) |
| **postgres** | Application database | 5432 (optional expose) |

## Request flow

1. Browser connects to `http://<host>:8080`
2. Static UI assets are served by the frontend container
3. API calls go to `/api/*` and are proxied to the backend container (`backend:3001`)
4. Backend manages nginx configuration, SSL, ModSecurity, and Bot Manager rules on disk volumes

## Volumes

- `postgres_data` — database
- `nginx_conf`, `nginx_logs`, `nginx_ssl` — nginx runtime state
- `backups` — backup archives

See [Docker Deployment](./docker.md) for installation steps.
