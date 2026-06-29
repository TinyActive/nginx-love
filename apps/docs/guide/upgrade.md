# Upgrade Guide

## Docker Compose (recommended)

1. Back up data volumes and `.env`
2. Pull or rebuild images:

```bash
git pull
docker compose build
docker compose up -d
```

3. The backend entrypoint runs Prisma migrations automatically
4. Verify health:

```bash
docker compose ps
./scripts/docker-smoke-test.sh
```

## Legacy VM installs

If you installed via `scripts/deploy.sh`, use `scripts/update.sh` and follow the release notes in the repository README.

## Database migrations

Bot Manager and other features add Prisma migrations under `apps/api/prisma/migrations/`. They apply on backend container start when using Docker.
