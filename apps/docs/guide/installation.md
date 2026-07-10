# Installation Guide

Install Nginx Love using **Docker Compose** (recommended) or the **legacy VM** script for host-native deployments.

## Prerequisites

### Docker (recommended)

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Linux with Docker 24+ | Ubuntu 22.04+ / Debian 12+ |
| RAM | 2 GB | 4 GB+ |
| Disk | 10 GB | 20 GB+ |
| Software | Docker Engine + Compose v2 | — |

### Legacy VM

| Requirement | Details |
|-------------|---------|
| OS | Ubuntu/Debian 22.04+ |
| Access | root or sudo |
| RAM | 4 GB recommended |
| Disk | 10 GB+ free |

---

## Method 1: Docker production (recommended)

Full details: [Docker guide](./docker.md) · [Architecture](./architecture.md)

### Install

```bash
git clone https://github.com/TinyActive/nginx-love.git
cd nginx-love
bash scripts/install-docker.sh
```

The script creates `.env` from [`.env.docker.example`](../../.env.docker.example) (with generated secrets), builds images, and starts the stack. The base nginx image build can take **~15 minutes** on first run.

### Manual install

```bash
cp .env.docker.example .env
# Edit secrets in .env, then:
make all
docker compose --env-file .env up -d --build
```

### Pull from Docker Hub

```bash
cp .env.docker.example .env
# Set DOCKERHUB_USER and IMAGE_TAG in .env
docker compose -f docker-compose.yml -f docker-compose.pull.yml --env-file .env up -d
```

### Access

| URL | Purpose |
|-----|---------|
| `http://YOUR_IP:8080` | Admin web UI |
| `http://YOUR_IP:8080/api/health` | API health check |

Port **3001 is not exposed** on the host — API traffic goes through the frontend proxy at `/api`.

### Default login

```
Username: admin
Password: admin123
```

Also available: `operator` / `operator123`, `viewer` / `viewer123`. Change the admin password after install.

---

## Method 2: Legacy VM production

For servers already using host nginx + systemd, or when Docker is not available.

```bash
git clone https://github.com/TinyActive/nginx-love.git
cd nginx-love
sudo bash scripts/deploy.sh
```

`deploy.sh` installs:

- Node.js 20, pnpm, Docker (for Postgres only)
- PostgreSQL 15 in a Docker container on localhost
- Nginx + ModSecurity + JA4 from source
- Backend and frontend as systemd services

Credentials are saved to `/root/.nginx-love-credentials`.

### Access (legacy)

| URL | Purpose |
|-----|---------|
| `http://YOUR_IP:8080` | Admin UI |
| `http://YOUR_IP:3001/api/health` | API (direct; CORS configured by deploy script) |

Re-run `deploy.sh` with `--force-recreate-db` **only** to intentionally wipe the database.

---

## Method 3: Development

### Docker dev profile

```bash
bash scripts/quickstart.sh
# equivalent to:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Host-native dev (no full Docker stack)

```bash
bash scripts/quickstart.sh --legacy
```

See [Quick Start](./quick-start.md) for first-login steps.

---

## After installation

1. Log in and change the default admin password.
2. Follow [Quick Start](./quick-start.md) to add your first domain.
3. For upgrades, see [Upgrade guide](./upgrade.md).

## Migrate VM → Docker

```bash
sudo bash scripts/migrate-vm-to-docker.sh
```

Backs up Postgres and nginx config, stops systemd services, and starts the Compose stack.
