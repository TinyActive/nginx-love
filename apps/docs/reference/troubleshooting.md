# Troubleshooting

Common issues and fixes for Nginx Love.

## Docker

### Cannot access API on port 3001

**Expected behavior** in Docker production (v2.2.0+). Port 3001 is internal only.

Use the proxied API instead:

```bash
curl http://localhost:8080/api/health
```

For localhost debugging:

```bash
docker compose -f docker-compose.yml -f docker-compose.expose-api.yml up -d
curl http://127.0.0.1:3001/api/health
```

### Backend container unhealthy

```bash
docker compose logs backend
docker compose exec backend nginx -t
```

If migrations failed:

```bash
docker compose exec backend bash -c 'cd /app/apps/api && pnpm exec prisma migrate deploy'
```

Restart after fix:

```bash
docker compose restart backend
```

### Frontend shows login errors / network errors

1. Confirm backend is healthy: `docker compose ps`
2. Test proxy: `curl http://localhost:8080/api/health`
3. Check frontend logs: `docker compose logs frontend`
4. Rebuild frontend if `VITE_API_URL` was changed: `docker compose up -d --build frontend`

### Upload fails (SSL cert, backup)

The frontend nginx proxy allows up to **100 MB** uploads. If uploads still fail, check backend logs and increase limits in [`apps/web/nginx.conf.template`](../../apps/web/nginx.conf.template).

### Base image build fails

Building nginx + ModSecurity + JA4 from source takes ~15 minutes. On failure, check build logs for compile errors. Rebuild:

```bash
make base
make backend
docker compose up -d --build backend
```

### Reset stack (keep data)

```bash
docker compose down
docker compose up -d
```

### Reset database (destructive)

```bash
docker compose down -v   # removes volumes — data loss!
```

---

## Installation

### Database connection failed

**Docker:**

1. Check postgres is healthy: `docker compose ps`
2. Verify `DATABASE_URL` in `.env` uses hostname `postgres`
3. Ensure `DB_PASSWORD` matches in `DATABASE_URL` and `POSTGRES_PASSWORD`

**Legacy VM:**

1. Check Postgres container: `docker ps | grep nginx-love-postgres`
2. Verify `apps/api/.env` `DATABASE_URL` points to `localhost:5432`

---

## Domain issues

### Domain not accessible

1. Confirm DNS points to your server
2. Check nginx config was generated: UI → Domains → apply config
3. Reload nginx:

**Docker:**

```bash
docker compose exec backend nginx -t
docker compose exec backend nginx -s reload
```

**Legacy VM:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### SSL certificate not issued

1. Domain must resolve to this server
2. Port **80** must be reachable from the internet (HTTP-01 challenge)
3. Check ACME challenge path and backend logs

---

## ModSecurity

### Rules not applied

1. Verify ModSecurity module is loaded (Docker base image includes it)
2. Check domain has WAF enabled in the UI
3. Review logs: `docker compose exec backend tail -f /var/log/nginx/error.log`

---

## Legacy VM services

```bash
# Backend
sudo systemctl status nginx-love-backend
sudo journalctl -u nginx-love-backend -f

# Frontend
sudo systemctl status nginx-love-frontend

# Database
docker logs -f nginx-love-postgres

# Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## Getting help

- [FAQ](./faq.md)
- [GitHub Issues](https://github.com/TinyActive/nginx-love/issues)
- [Telegram community](https://t.me/nginxlove)
