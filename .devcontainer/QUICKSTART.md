# Devcontainer Quick Start

## 🚀 Getting Started (3 Steps)

### 1️⃣ Open in Devcontainer

```
Cmd+Shift+P → "Dev Containers: Reopen in Container"
```

Wait 3-5 minutes for first build. **Nginx starts automatically!**

### 2️⃣ Run Database Migrations

```bash
cd apps/api
pnpm prisma migrate dev
```

### 3️⃣ Start Development

```bash
# From root
pnpm dev
```

✅ Access:

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- Nginx Portal: http://localhost:8088
- Nginx HTTP: http://localhost:80
- Nginx HTTPS: https://localhost:443

---

## 📋 Common Commands

### Development

```bash
# Start all services
pnpm dev

# Build all apps
pnpm build

# Run linting
pnpm lint

# Clean all builds
pnpm clean
```

### Database (from apps/api/)

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database
pnpm prisma:seed

# Open Prisma Studio
pnpm prisma:studio
```

### Nginx

```bash
# View nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Reload nginx config
sudo nginx -s reload

# Test nginx config
sudo nginx -t

# Restart nginx
sudo service nginx restart

# Check nginx status
sudo service nginx status
```

### Docker

```bash
# View all containers
docker ps

# View postgres logs
docker logs nginx-love-devcontainer-postgres

# Restart postgres
docker restart nginx-love-devcontainer-postgres

# Stop all services
docker-compose -f .devcontainer/docker-compose.yml down
```

---

## 🌐 Local Domain Setup

### Step 1: Add to Mac's /etc/hosts

```bash
sudo nano /etc/hosts

# Add these lines:
127.0.0.1    test.local
127.0.0.1    admin.test.local
127.0.0.1    api.test.local
```

### Step 2: Add Domain Through UI

1. Open the frontend at http://localhost:8080
2. Navigate to the Domains section
3. Add your domain (e.g., test.local)
4. The backend will automatically create and apply the nginx configuration

### Step 3: Test

```bash
curl http://test.local
curl http://api.test.local
```

---

## 🔧 Troubleshooting

### Can't access nginx logs

```bash
sudo chown -R node:node /var/log/nginx
```

### Database connection failed

```bash
# Test connection
psql postgresql://nginx_love_user:change_this_password@postgres:5432/nginx_love_db -c "SELECT 1"
```

### Port conflicts

```bash
# Stop existing containers
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.db.yml down
```

### Rebuild container

```
Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

---

## 📁 Important Paths

| Description      | Path                         |
| ---------------- | ---------------------------- |
| Nginx logs       | `/var/log/nginx/`            |
| SSL certificates | `/etc/nginx/ssl/`            |
| Nginx configs    | `/etc/nginx/conf.d/`         |
| ACME challenges  | `/var/www/html/.well-known/` |
| Workspace        | `/workspace`                 |

---

## 🔗 Service URLs (from inside container)

```bash
# Nginx (running in same container)
http://localhost:80
http://localhost:443
http://localhost:8088

# PostgreSQL (in postgres container)
postgresql://nginx_love_user:change_this_password@postgres:5432/nginx_love_db

# Host machine (from container)
http://host.docker.internal:PORT
```

---

## 💡 Tips

- **Nginx**: Runs inside the same container as your code
- **Terminal**: Already inside container with zsh as root user
- **Sudo**: Full sudo access (passwordless) for all commands
- **Hot Reload**: Vite HMR works automatically
- **Extensions**: Auto-installed on container startup
- **Git**: Pre-configured for safe directory
- **Backend**: Can access nginx logs, run `sudo nginx -t`, create SSL certs directly

---

## 📚 Full Documentation

See [README.md](.devcontainer/README.md) for detailed documentation.
