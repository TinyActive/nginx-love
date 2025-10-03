# Nginx Love Devcontainer

This devcontainer setup provides a complete development environment with all services properly networked together.

## 🎯 What This Solves

1. **✅ Nginx Log Access**: Backend can now read nginx logs from `/var/log/nginx/`
2. **✅ File System Access**: Backend can create directories and manage nginx SSL certificates
3. **✅ Network Communication**: All services (nginx, postgres, backend, frontend) can communicate
4. **✅ Local Domain Testing**: Support for testing with fake local domains
5. **✅ Consistent Environment**: Same setup across all developers

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           Dev Container (workspace)             │
│  - Node 20 + pnpm                              │
│  - Your code (/workspace)                      │
│  - Backend API (port 3001)                     │
│  - Frontend (port 8080)                        │
│  - Shared volumes with nginx                   │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │                           │
┌───────▼────────┐          ┌───────▼────────┐
│  Nginx         │          │  PostgreSQL    │
│  - Port 8088   │          │  - Port 5432   │
│  - Port 80/443 │          │                │
│  - Shared logs │          └────────────────┘
│  - Shared SSL  │
└────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Visual Studio Code
- Docker Desktop for Mac
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Step 1: Open in Devcontainer

1. Open this project in VS Code
2. Press `Cmd+Shift+P` and select **"Dev Containers: Reopen in Container"**
3. Wait for the container to build (first time takes 3-5 minutes)
4. VS Code will automatically reload inside the container

### Step 2: Install Dependencies

The devcontainer automatically runs `pnpm install` on creation, but if needed:

```bash
pnpm install
cd apps/api && pnpm prisma generate
```

### Step 3: Database Migration

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma:seed  # Optional: seed with test data
```

### Step 4: Start Development

```bash
# From workspace root
pnpm dev
```

This will start:

- Frontend (Vite) on `http://localhost:8080`
- Backend (API) on `http://localhost:3001`
- Nginx on `http://localhost:8088`
- PostgreSQL on `localhost:5432`

## 📁 Shared Volumes

The following directories are shared between containers:

| Volume            | Path in Workspace           | Path in Nginx               | Purpose                        |
| ----------------- | --------------------------- | --------------------------- | ------------------------------ |
| `nginx-logs`      | `/var/log/nginx`            | `/var/log/nginx`            | Access nginx logs from backend |
| `nginx-ssl`       | `/etc/nginx/ssl`            | `/etc/nginx/ssl`            | SSL certificate management     |
| `nginx-config`    | `/etc/nginx/conf.d`         | `/etc/nginx/conf.d`         | Dynamic nginx config           |
| `acme-challenges` | `/var/www/html/.well-known` | `/var/www/html/.well-known` | Let's Encrypt ACME             |

## 🌐 Local Domain Testing

### Adding Domains

Add to your **Mac's** `/etc/hosts` (not container):

```bash
sudo nano /etc/hosts
```

Add these lines:

```
# Nginx Love Development Domains
127.0.0.1    test.local
127.0.0.1    admin.test.local
127.0.0.1    api.test.local
```

### Testing Domains

The backend will automatically create nginx configurations when you add domains through the frontend UI.

1. Add a domain through the UI at http://localhost:8080
2. The backend will automatically generate and apply the nginx configuration
3. Access your domains:
   - http://test.local → Frontend
   - http://api.test.local → Backend API

## 🔧 Common Tasks

### Access Nginx Logs from Backend

Logs are available at `/var/log/nginx/`:

```typescript
// In your backend code
const accessLog = "/var/log/nginx/access.log";
const errorLog = "/var/log/nginx/error.log";
```

### Manage SSL Certificates

```bash
# From workspace
sudo mkdir -p /etc/nginx/ssl/domain.com
sudo cp cert.pem /etc/nginx/ssl/domain.com/
sudo cp key.pem /etc/nginx/ssl/domain.com/
```

### Run Database Commands

```bash
cd apps/api

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Open Prisma Studio
pnpm prisma:studio  # Opens on port 5555
```

### Access Services from Container

- Nginx: `http://nginx:8088` or `http://nginx:80`
- PostgreSQL: `postgresql://nginx_love_user:change_this_password@postgres:5432/nginx_love_db`
- Host machine: `http://host.docker.internal:PORT`

### Rebuild Container

If you need to rebuild (e.g., after changing Dockerfile):

1. `Cmd+Shift+P` → **"Dev Containers: Rebuild Container"**
2. Or from terminal: `docker-compose -f .devcontainer/docker-compose.yml build --no-cache`

## 🐛 Troubleshooting

### Can't access nginx logs

Check permissions:

```bash
sudo chown -R node:node /var/log/nginx
ls -la /var/log/nginx
```

### Port already in use

Stop existing containers:

```bash
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.db.yml down
```

### Database connection failed

Check if postgres is running:

```bash
docker ps | grep postgres
psql postgresql://nginx_love_user:change_this_password@postgres:5432/nginx_love_db -c "SELECT 1"
```

### Nginx not starting

Check nginx logs:

```bash
docker logs nginx-love-nginx
```

### Can't write to SSL directory

Run the post-start command manually:

```bash
sudo chown -R node:node /etc/nginx/ssl /var/www/html/.well-known
```

## 📝 Environment Variables

### Devcontainer (.devcontainer/.env)

```bash
DB_NAME=nginx_love_db
DB_USER=nginx_love_user
DB_PASSWORD=change_this_password
DB_PORT=5432
```

### API (apps/api/.env)

The DATABASE_URL is automatically set by docker-compose to connect to the postgres service.

## 🔄 Migration from Host Development

If you were running on host before:

1. **Stop existing services**:

   ```bash
   docker-compose -f docker-compose.yml down
   docker-compose -f docker-compose.db.yml down
   ```

2. **Open in devcontainer** (see "Getting Started")

3. **Update connection strings**:
   - Frontend API calls: Use `http://localhost:3001` (same as before)
   - Backend DB: Use `postgres` hostname (auto-configured)

## 🎨 VS Code Extensions

The devcontainer automatically installs:

- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- Docker
- Nginx Language Support
- Error Lens

## 📚 Additional Resources

- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 🙋 FAQ

**Q: Can I still use `pnpm dev` on my host?**
A: Yes, but you'll need to keep the original docker-compose files running for nginx and postgres.

**Q: How do I access the container shell?**
A: VS Code terminal automatically opens inside the container. Or use: `docker exec -it nginx-love-devcontainer zsh`

**Q: Can I use this in production?**
A: No, this is for development only. Use the main Dockerfile for production builds.

**Q: How do I share this setup with my team?**
A: Just commit the `.devcontainer` folder. Anyone with VS Code + Docker can use it.
