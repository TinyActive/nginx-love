# Docker Deployment

Docker Compose is the **recommended** way to run Nginx Love.

## Quick start

```bash
cp .env.docker.example .env
# Edit .env — set DB_PASSWORD, JWT_* secrets, SESSION_SECRET

docker compose up -d
```

Open **http://localhost:8080** and sign in with the default admin user (created by `seed-safe` on first start).

## Services

The default [`docker-compose.yml`](../../docker-compose.yml) defines:

- `postgres` — PostgreSQL 15 with health checks
- `backend` — API + nginx + ModSecurity + JA4
- `frontend` — Admin UI on port 8080

## Environment

Key variables (see [`.env.docker.example`](../../.env.docker.example)):

| Variable | Purpose |
|----------|---------|
| `DB_PASSWORD` | Postgres password |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | API tokens |
| `DISABLE_CORS=true` | Same-origin proxy mode (default) |
| `WEB_PORT=8080` | Admin UI port |

## Optional compose files

- `docker-compose.db.yml` — external database only
- `docker-compose.pull.yml` — pull pre-built images from Docker Hub
- `docker-compose.expose-api.yml` — expose API on host :3001 (dev)

## Smoke test

After `docker compose up -d`, run:

```bash
./scripts/docker-smoke-test.sh
```

## Upgrade

See [Upgrade Guide](./upgrade.md).
