# Introduction

**Nginx Love** is an open-source platform for managing Nginx with ModSecurity WAF, SSL, load balancing, and bot detection — all through a web interface instead of manual config files.

## What is Nginx Love?

Nginx Love simplifies day-to-day operations for teams that run Nginx as a reverse proxy or load balancer:

- **Domain management** — upstreams, health checks, HTTPS backends
- **SSL certificates** — Let's Encrypt automation and manual upload
- **ModSecurity WAF** — OWASP CRS and custom rules per domain
- **Bot Manager (JA4)** — TLS fingerprint policies, profiles, and analytics
- **Performance & logs** — metrics, log analysis, alerting
- **Multi-user access** — role-based permissions (admin / moderator / viewer)

## Deployment models

| Model | Best for | Install |
|-------|----------|---------|
| **Docker Compose** | New servers, easiest upgrades | [`scripts/install-docker.sh`](../../scripts/install-docker.sh) |
| **Legacy VM** | Existing host-native installs | [`scripts/deploy.sh`](../../scripts/deploy.sh) |

Docker is the **recommended** path. The admin UI is served on port **8080**; the API is proxied at `/api` (same-origin, no CORS setup). See [Architecture](./architecture.md).

Legacy VM installs run nginx and systemd services directly on the host. See [Installation](./installation.md#method-2-legacy-vm-production-installation).

## Who is this for?

- System administrators managing Nginx and WAF rules
- DevOps teams needing centralized SSL and domain configuration
- Security engineers configuring ModSecurity and bot fingerprint policies
- Small teams who want production-grade WAF without enterprise complexity

## Key concepts

**Domains** — A domain represents a site or application fronted by Nginx. Each domain has its own upstreams, SSL settings, WAF rules, and optional Bot Manager profile.

**SSL** — Certificates are issued via Let's Encrypt (ACME) or uploaded manually. Renewal can be scheduled from the UI.

**ModSecurity** — OWASP CRS rules and custom rules are applied per domain. The platform generates and reloads nginx configuration.

**Bot Manager** — Uses JA4 TLS fingerprints to classify clients and apply allow/deny policies. See [Bot Manager guide](./bot-manager.md).

## Next steps

- [Installation](./installation.md) — install Nginx Love
- [Docker deployment](./docker.md) — Docker-specific details
- [Architecture](./architecture.md) — services, ports, and data flow
- [Quick Start](./quick-start.md) — first login and first domain
