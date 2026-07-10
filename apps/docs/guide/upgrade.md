# Upgrade Guide

## Docker Compose (recommended)

1. Back up data volumes and `.env`
2. Pull or rebuild images:

```bash
git pull
bash scripts/upgrade-docker.sh
# or: docker compose build && docker compose up -d
```

3. On each backend container start, the entrypoint automatically:
   - Runs Prisma migrations
   - Syncs `nginx.conf` (JA4 log formats and modules)
   - **Regenerates all domain vhosts** from the database (JA4 `ja4 on`, Bot Manager, SSL)
4. Verify health:

```bash
docker compose ps
./scripts/docker-smoke-test.sh
```

Upgrading from an older install without JA4: no manual step is required — vhosts in the `nginx_conf` volume are rewritten on backend start.

## Legacy VM installs

If you installed via `scripts/deploy.sh`, use `scripts/update.sh`. It upgrades nginx core when needed and regenerates domain vhosts when JA4 is missing or nginx core was rebuilt.

## Database migrations

Bot Manager and other features add Prisma migrations under `apps/api/prisma/migrations/`. They apply on backend container start when using Docker.
