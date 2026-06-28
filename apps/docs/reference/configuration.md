# Configuration

Environment variables for Nginx Love. Use [`.env.docker.example`](../../.env.docker.example) as the template for Docker Compose.

## Docker Compose (recommended)

Copy and edit:

```bash
cp .env.docker.example .env
```

### Database

```env
DB_NAME=nginx_love_db
DB_USER=nginx_love_user
DB_PASSWORD=<secure-password>
DB_PORT=5432
DATABASE_URL=postgresql://nginx_love_user:<password>@postgres:5432/nginx_love_db?schema=public
```

Inside Compose, the database hostname is **`postgres`** (the service name), not `localhost`.

### Application

```env
API_PORT=3001          # Internal container port (not published to host)
NODE_ENV=production
WEB_PORT=8080          # Host port for admin UI
```

### Proxy-only API (no CORS)

```env
API_BEHIND_PROXY=true
DISABLE_CORS=true
VITE_API_URL=/api
```

When `DISABLE_CORS=true`, the browser reaches the API only through the frontend nginx proxy at `/api`. No `CORS_ORIGIN` configuration is required.

To debug the API directly on localhost (re-enables CORS):

```bash
docker compose -f docker-compose.yml -f docker-compose.expose-api.yml up -d
```

### Security / JWT

```env
JWT_ACCESS_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<random-64-chars>
SESSION_SECRET=<random-64-chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
```

Generate secrets:

```bash
openssl rand -base64 48
```

### SSL paths (inside backend container)

```env
SSL_DIR=/etc/nginx/ssl
ACME_DIR=/var/www/html/.well-known/acme-challenge
```

### SMTP (optional)

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=<password>
TWO_FACTOR_APP_NAME=Nginx Love Admin
```

### Docker Hub images

```env
DOCKERHUB_USER=your-dockerhub-user
IMAGE_TAG=v2.2.0
```

Used with `docker compose -f docker-compose.yml -f docker-compose.pull.yml up -d`.

---

## Legacy VM

Legacy installs use separate env files:

- Backend: [`apps/api/.env.example`](../../apps/api/.env.example)
- Frontend: [`apps/web/.env.example`](../../apps/web/.env.example)

Legacy deployments set `CORS_ORIGIN` to include the public IP and frontend URL. Example:

```env
CORS_ORIGIN=http://YOUR_IP:8080,http://localhost:8080
VITE_API_URL=http://YOUR_IP:3001/api
```

See [`scripts/deploy.sh`](../../scripts/deploy.sh) for auto-generated values.

---

## Development overrides

Use `docker-compose.dev.yml` to expose the API on localhost and enable CORS:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

## Related

- [Docker deployment](../guide/docker.md)
- [Architecture](../guide/architecture.md)
- [Troubleshooting](./troubleshooting.md)
