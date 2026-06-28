---
layout: home
hero:
  name: Nginx Love
  text: Nginx + ModSecurity Management Platform
  tagline: Manage domains, SSL, WAF, and bot detection through a modern web interface — Docker-first deployment
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: Docker Install
      link: /guide/docker
    - theme: alt
      text: View on GitHub
      link: https://github.com/TinyActive/nginx-love
features:
  - title: Docker-first deployment
    details: One-command install with Docker Compose — admin UI on :8080, API proxied at /api, no CORS setup
  - title: ModSecurity WAF
    details: OWASP CRS and custom rules with per-domain configuration and reload
  - title: Bot Manager (JA4)
    details: TLS fingerprint detection, profiles, and allow/deny policies
  - title: SSL automation
    details: Let's Encrypt issuance, renewal, and manual certificate upload
  - title: Performance & alerts
    details: Metrics, log analysis, and email/Telegram notifications
  - title: Multi-user RBAC
    details: Admin, moderator, and viewer roles with activity logging
---

## Quick Start

```bash
git clone https://github.com/TinyActive/nginx-love.git
cd nginx-love
bash scripts/install-docker.sh
```

Open **http://localhost:8080** — login `admin` / `admin123`.

## Documentation

| Section | Description |
|---------|-------------|
| [Guide](/guide/introduction) | Concepts, installation, features |
| [Architecture](/guide/architecture) | Services, ports, request flow |
| [API Reference](/api/auth) | REST API endpoints |
| [Configuration](/reference/configuration) | Environment variables |
| [Troubleshooting](/reference/troubleshooting) | Common issues |
