# Bot Manager (JA4)

Bot Manager uses **JA4 TLS/HTTP fingerprints** to identify and control automated clients at the nginx layer.

## Features

- **Global rules** — apply fingerprint allow/deny policies platform-wide
- **Profiles** — reusable rule sets assigned to domains
- **Fingerprint library** — built-in templates for common clients
- **Analytics** — parse JA4 fields from nginx access logs

## Requirements

- HTTPS enabled on the domain (JA4 TLS directives require an SSL context)
- JA4 dynamic module bundled in the Nginx Love backend image

## Enable on a domain

1. Open **Domains** → edit domain
2. Enable **Bot Manager**
3. Assign one or more bot profiles (optional)
4. Save — nginx config is regenerated and reloaded

## API

Authenticated endpoints under `/api/bot-manager/`:

- `GET /profiles`, `POST /profiles`
- `GET /rules`, `POST /rules`
- `POST /apply` — regenerate nginx configs

## Related

- [Domain Management](./domains.md)
- [Docker Deployment](./docker.md)
