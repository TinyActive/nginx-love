# Frequently Asked Questions

## General

### What is Nginx Love?

Nginx Love is an open-source platform for managing Nginx, ModSecurity WAF, SSL certificates, load balancing, and bot detection (JA4) through a web UI.

### Is it free?

Yes. Nginx Love is open source. See [LICENSE](https://github.com/TinyActive/nginx-love/blob/main/LICENSE) for terms.

### Can I use it in production?

Yes. Docker Compose is the recommended production install. Test in staging first for critical workloads.

## Installation

### Which install method should I use?

| Situation | Method |
|-----------|--------|
| New server | Docker — `bash scripts/install-docker.sh` |
| Upgrade Docker install | `bash scripts/upgrade-docker.sh` |
| Existing host-native install | Legacy — `scripts/update.sh` |
| Move VM → Docker | `scripts/migrate-vm-to-docker.sh` |

### What are the system requirements?

**Docker (recommended):**

- Docker 24+ and Compose v2
- 2 GB RAM minimum, 4 GB recommended
- 10 GB disk

**Legacy VM:**

- Ubuntu/Debian 22.04+
- Nginx 1.28, ModSecurity 3, PostgreSQL 15 (installed by `deploy.sh`)

## Docker & networking

### Do I need to configure CORS?

**No** for default Docker production. The frontend proxies `/api` on the same origin (`:8080`). Set `DISABLE_CORS=true` and `API_BEHIND_PROXY=true` in `.env` (defaults in `.env.docker.example`).

Legacy VM installs and dev mode with direct API access may require `CORS_ORIGIN`.

### Why can't I access port 3001?

From v2.2.0, Docker does not publish port 3001 to the host. Use:

```
http://YOUR_HOST:8080/api/...
```

For debugging: `docker compose -f docker-compose.yml -f docker-compose.expose-api.yml up -d`

### Which ports are public?

| Port | Purpose |
|------|---------|
| 8080 | Admin UI + API proxy |
| 80, 443 | WAF / customer websites |
| 3001, 5432 | Internal only (Docker network) |

## Usage

### Can I manage multiple domains?

Yes. Add domains from the UI; nginx configuration is generated and applied automatically.

### Default login credentials?

```
admin / admin123
operator / operator123
viewer / viewer123
```

Change the admin password after install.

### How do I upgrade?

See the [Upgrade guide](../guide/upgrade.md).

## Related

- [Installation](../guide/installation.md)
- [Docker deployment](../guide/docker.md)
- [Troubleshooting](./troubleshooting.md)
