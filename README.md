# 🚀 Nginx WAF - Advanced Nginx Management Platform

Comprehensive Nginx management system with ModSecurity WAF, Domain Management, SSL Certificates and Real-time Monitoring.

<a href="https://www.producthunt.com/products/waf-advanced-nginx-management-platform?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-waf-advanced-nginx-management-platform" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1023177&theme=light&t=1759655841567" alt="Nginx WAF - Advanced Nginx Management Platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>


# Project Goal
This project began as a private service built for a company. Later, my client and I decided to make it open source and free for the community to meet the personal or organizational needs of providing users with an easy way to configure Loadbalancer for server systems with SSL termination, Web Application Firewall, and it should be so easy that even a monkey could do it. This goal remains the same Although there may be advanced options, they are optional and the project should be as simple as possible to minimize the barrier to entry. The software will have all the features of an application for a digital business that is needed in the context of technological development to rapidly develop the system along with ensuring system security.


## 🖥️ Cross-Platform Support

Nginx WAF - Advanced Nginx Management Platform offers full support for major operating systems: **Windows**, **macOS**, and **Linux**. You can deploy, manage, and use this tool on any platform, ensuring flexibility for individuals and organizations. 

**Download the latest release:**  
[Nginx WAF Apps Client Releases](https://github.com/TinyActive/nginx-waf-apps-client/releases)



## ✨ Key Features

- 🔒 **ModSecurity WAF** - OWASP Core Rule Set (CRS) + Custom Rules
- 🌐 **Domain Management** - Load balancing, upstream monitoring, HTTPS backend support
- 🔐 **SSL Certificate Management** - Auto Let's Encrypt + Manual upload
- 👥 **Multi-user Management** - Role-based access control (Admin/Moderator/Viewer)
- 📊 **Real-time Monitoring** - Performance metrics, alerts, system health
- 🛡️ **Access Control Lists (ACL)** - IP whitelist/blacklist, GeoIP, User-Agent filtering
- 📋 **Activity Logging** - Comprehensive audit trail
- 🔔 **Smart Alerts** - Email/Telegram notifications with custom conditions
- 💾 **Database Management** - SQLite with Prisma ORM (no Docker required)
- 🎨 **Modern UI** - React + TypeScript + ShadCN UI + Tailwind CSS

## 📦 Quick Start

### Choose the appropriate script:

| Use Case | Script | Description |
|----------|--------|-------------|
| **New Server (Production)** | `./scripts/deploy.sh` | Full installation of Nginx + ModSecurity + Backend + Frontend with systemd services |
| **Development/Testing** | `./scripts/quickstart.sh` | Quick run in dev mode (no Nginx installation, no root required) |
| **Upgrade New Version** | `./scripts/update.sh` | Full update to new version |
| **Migrate PostgreSQL → SQLite** | `./scripts/migrate-postgres-to-sqlite.sh` | Migrate existing PostgreSQL data to SQLite (see [Migration Guide](docs/MIGRATION_POSTGRES_TO_SQLITE.md)) |

| Use Case | Port | Description |
|----------|--------|-------------|
| **Front-end** | 8080 | Nginx WAF - Advanced Nginx Management Platform Front-end. User required |
| **Backend** | 3001 |  Nginx WAF - Advanced Nginx Management Platform Backend port required |
| **Website** | 80 | Website needs to be protected |
| **Website** | 443 | Website needs to be protected |


### 🖥️ Production Deployment (New Server)

```bash
# Clone repository
git clone https://github.com/TinyActive/nginx-love.git
cd nginx-love

# Run deployment script (requires root)
bash scripts/deploy.sh
```

### 🖥️ Production Upgrade Deployment (Upgrade New Version for script install)

```bash
# Run Upgrade script (requires root)
cd nginx-love
git pull
bash scripts/update.sh
```

### 🔄 Migrating from PostgreSQL to SQLite

If you have an existing installation using PostgreSQL and want to migrate to SQLite:

```bash
# Navigate to your nginx-love directory
cd nginx-love

# Run the migration script (requires root)
sudo bash scripts/migrate-postgres-to-sqlite.sh
```

**What the migration script does:**
- ✅ Exports all data from PostgreSQL (users, domains, SSL certificates, rules, etc.)
- ✅ Creates a new SQLite database
- ✅ Imports all data with proper type conversions
- ✅ Backs up your original configuration
- ✅ Provides rollback instructions if needed

**After migration:**
1. Restart services: `sudo systemctl restart nginx-love-backend nginx-love-frontend`
2. Verify all data is present in the web interface
3. Optionally remove PostgreSQL: See [Migration Guide](docs/MIGRATION_POSTGRES_TO_SQLITE.md)

📖 **Full Migration Guide**: [docs/MIGRATION_POSTGRES_TO_SQLITE.md](docs/MIGRATION_POSTGRES_TO_SQLITE.md)

### 🖥️ Production Deployment (Docker container)

## Environment Setup

Before running the application, you need to set up your environment variables:

1. Copy the example environment file to create your local environment configuration:
   ```bash
   cp .env.example .env
   ```

   Update the following required environment variables in your `.env` file:

      | Variable | Description | Example Value | Required |
      |----------|-------------|---------------|----------|
      | `JWT_ACCESS_SECRET` | Secret key for JWT access tokens | `your-random-secret-key-32-chars` | ✅ Yes |
      | `JWT_REFRESH_SECRET` | Secret key for JWT refresh tokens | `your-random-secret-key-32-chars` | ✅ Yes |
      | `SESSION_SECRET` | Secret key for session management | `your-random-secret-key-32-chars` | ✅ Yes |
      | `VITE_API_URL` | Backend API URL for frontend | `http://YOUR_SERVER_IP:3001/api` | ✅ Yes |
      | `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://YOUR_SERVER_IP:8080,http://localhost:8080` | ✅ Yes |

      **Security Note**: Generate strong random secrets using:
      ```bash
      openssl rand -base64 32
      ```

      **Database Note**: SQLite is used by default (file-based, no separate server needed). The database file will be created automatically at `apps/api/prisma/nginx_waf.db`.

2. Edit the `.env` file and configure the necessary environment variables according to your local setup.




**Note**: The `.env.example` file serves as a template with all required environment variables. Make sure to update the values in your `.env` file with your actual configuration before starting the application.


```bash
# Clone repository
git clone https://github.com/TinyActive/nginx-love.git
cd nginx-love

# Run script install docker latest version
bash docker/scripts/docker.sh
docker-compose build && docker-compose up -d

```

### 🖥️ Production Upgrade Deployment (Upgrade New Version for docker compose)

**⚠️ Important Notice:**

Currently, automatic upgrades are **not supported** for Docker Compose deployments. You must perform manual upgrades following the steps below.

**Before upgrading, please note:**

- ⏱️ **Downtime Expected**: Your services will be temporarily unavailable during the upgrade process
- 💾 **Backup Required**: Always backup your database and configuration files before upgrading
- 🔧 **Manual Process**: You need to manually pull updates and rebuild containers
- 🚧 **Work in Progress**: Our team is actively developing an automated upgrade tool to make this process safer and easier

**Estimated Downtime:** 5-15 minutes depending on your server specifications.

**You can backup all data then reinstall the system and restore using the tools in the software. Unfortunately we are working on automatic updates in the future but currently we do not support containers if you have a solution you can contribute to us.**

**Coming Soon:** Our team is developing a safe upgrade utility that will:
- ✅ Automated backup before upgrade
- ✅ Zero-downtime rolling updates
- ✅ Automatic rollback on failure
- ✅ Configuration migration assistance

**Need help?** Join our [Telegram Support](https://t.me/nginxlove) for upgrade assistance.



**Minimum Requirements:**
- Ubuntu/Debian server (22.04+ recommended)
- Root access
- RAM: 2GB+ (4GB+ recommended)
- Storage: 10GB+ free space
- Internet connection

The script will **automatically install everything**:
- ✅ Node.js 20.x (if not present)
- ✅ pnpm 8.15.0 (if not present)
- ✅ Nginx + ModSecurity + OWASP CRS
- ✅ Backend API + Frontend (production build)
- ✅ SQLite database (file-based, no Docker required)
- ✅ Systemd services with auto-start
- ✅ CORS configuration with Public IP

**Credentials saved at:** `/root/.nginx-love-credentials`

### 💻 Development Setup

```bash
# Clone repository
git clone https://github.com/TinyActive/nginx-love.git
cd nginx-love

# Run quick start (no root required)
./scripts/quickstart.sh
```

This will:
- Install dependencies
- Create SQLite database file automatically
- Run database migrations and seeding
- Start backend on http://localhost:3001
- Start frontend on http://localhost:8080 (dev mode)

**Press Ctrl+C to stop all services**

## 🔐 Default Login

```
Username: admin
Password: admin123
```

⚠️ **Change password immediately after first login!**

## 🌐 Access URLs

### Development (quickstart.sh)
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Prisma Studio**: http://localhost:5555 (dev only)
- **Health Check**: http://localhost:3001/api/health

### Production (deploy.sh)
- **Frontend**: http://YOUR_IP:8080
- **Backend API**: http://YOUR_IP:3001
- **API Documentation**: http://YOUR_IP:3001/api-docs
- **Health Check**: http://YOUR_IP:3001/api/health

## 📚 Documentation

- [API Documentation](./docs/API.md) - Complete REST API reference
- [OpenAPI Specification](./apps/api/openapi.yaml) - Swagger/OpenAPI 3.0 spec
- [Database Schema](./apps/api/prisma/schema.prisma) - Prisma schema with relationships
- [Installation Scripts](./scripts/) - Automated installation scripts

## 🔌 API Endpoints Overview

### Authentication & Account
- `POST /api/auth/login` - User login with 2FA support
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/account/profile` - Get user profile
- `PUT /api/account/profile` - Update user profile
- `POST /api/account/change-password` - Change password

### Domain Management
- `GET /api/domains` - List all domains
- `POST /api/domains` - Create new domain
- `PUT /api/domains/:id` - Update domain configuration
- `DELETE /api/domains/:id` - Delete domain
- `GET /api/domains/:id/upstreams` - Get domain upstreams
- `POST /api/domains/:id/upstreams` - Add upstream server

### SSL Certificate Management
- `GET /api/ssl/certificates` - List SSL certificates
- `POST /api/ssl/generate` - Generate Let's Encrypt certificate
- `POST /api/ssl/upload` - Upload custom certificate
- `DELETE /api/ssl/:id` - Delete certificate
- `POST /api/ssl/renew` - Renew certificate

### ModSecurity WAF
- `GET /api/modsec/crs-rules` - List OWASP CRS rules
- `PUT /api/modsec/crs-rules/:id` - Toggle CRS rule
- `GET /api/modsec/custom-rules` - List custom rules
- `POST /api/modsec/custom-rules` - Create custom rule
- `PUT /api/modsec/custom-rules/:id` - Update custom rule

### Access Control Lists (ACL)
- `GET /api/acl/rules` - List ACL rules
- `POST /api/acl/rules` - Create ACL rule
- `PUT /api/acl/rules/:id` - Update ACL rule
- `DELETE /api/acl/rules/:id` - Delete ACL rule

### Monitoring & Alerts
- `GET /api/performance/metrics` - Get performance metrics
- `GET /api/alerts/rules` - List alert rules
- `POST /api/alerts/rules` - Create alert rule
- `GET /api/alerts/history` - Alert history
- `POST /api/alerts/acknowledge` - Acknowledge alert

### System Management
- `GET /api/system/status` - System health status
- `POST /api/system/nginx/reload` - Reload Nginx configuration
- `GET /api/logs` - System logs with filtering
- `GET /api/users` - User management (admin only)

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **UI Library**: ShadCN UI + Radix UI Primitives
- **Styling**: Tailwind CSS + CSS Variables
- **State Management**: Zustand + TanStack Query
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: i18next

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js + TypeScript
- **Database ORM**: Prisma
- **Authentication**: JWT + Refresh Tokens + 2FA (TOTP)
- **Validation**: Express Validator
- **Security**: Helmet + CORS + bcrypt
- **Logging**: Winston + Morgan
- **Email**: Nodemailer
- **API Documentation**: OpenAPI/Swagger

### Infrastructure
- **Database**: SQLite 3 (file-based, no server required)
- **Web Server**: Nginx + ModSecurity 3.x
- **SSL**: Let's Encrypt (acme.sh) + Manual certificates
- **WAF**: OWASP ModSecurity Core Rule Set (CRS)
- **Containerization**: Docker + Docker Compose
- **Process Management**: systemd (production)

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   Frontend      │◄───┤   Nginx Proxy    │◄───┤   Users/API     │
│   (React SPA)   │    │   + ModSecurity  │    │   Clients       │
│   Port: 8080    │    │   + SSL          │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│                 │    │                  │
│   Backend API   │    │   Upstream       │
│   (Express.js)  │    │   Applications   │
│   Port: 3001    │    │   (HTTP/HTTPS)   │
└─────────────────┘    └──────────────────┘
         │
         ▼
┌─────────────────┐
│                 │
│   SQLite DB     │
│   (File-based)  │
│   nginx_waf.db  │
└─────────────────┘
```

## 📊 Database Schema

### Core Models
- **Users**: Multi-role user management (admin/moderator/viewer)
- **Domains**: Domain configuration with upstream management
- **Upstreams**: Backend server configuration with health checks
- **SSL Certificates**: Certificate management with auto-renewal
- **ModSecurity Rules**: CRS rules + custom rules per domain
- **ACL Rules**: Access control with multiple conditions
- **Performance Metrics**: Real-time performance tracking
- **Alert System**: Configurable alerts with multi-channel notifications
- **Activity Logs**: Comprehensive audit trail

**Database**: SQLite 3 (file-based at `apps/api/prisma/nginx_waf.db`)
- No Docker required
- No PostgreSQL installation needed
- Simple backup: just copy the `.db` file

## 🔧 Service Management

### Production (systemd services)

```bash
# Backend API Service
sudo systemctl start nginx-love-backend
sudo systemctl stop nginx-love-backend
sudo systemctl restart nginx-love-backend
sudo systemctl status nginx-love-backend

# Frontend Service
sudo systemctl start nginx-love-frontend
sudo systemctl stop nginx-love-frontend
sudo systemctl restart nginx-love-frontend
sudo systemctl status nginx-love-frontend

# Nginx Web Server
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl status nginx
sudo nginx -t  # Test configuration
sudo nginx -s reload  # Reload configuration
```

### Database Management

```bash
# Backup database
sudo cp /path/to/apps/api/prisma/nginx_waf.db /path/to/backup/nginx_waf.db.backup

# Restore database
sudo cp /path/to/backup/nginx_waf.db.backup /path/to/apps/api/prisma/nginx_waf.db
sudo systemctl restart nginx-love-backend

# View database (using sqlite3 CLI)
sqlite3 /path/to/apps/api/prisma/nginx_waf.db
# .tables          # List all tables
# .schema users    # Show table structure
# SELECT * FROM users LIMIT 5;  # Query data
# .quit            # Exit
```

### Development Environment

```bash
# Start development servers
cd nginx-love

# Backend (Terminal 1)
cd apps/api && pnpm dev

# Frontend (Terminal 2)
cd apps/web && pnpm dev

# Database operations
cd apps/api
pnpm prisma:studio    # Open Prisma Studio
pnpm prisma:migrate   # Run migrations
pnpm prisma:seed      # Seed database

# Stop services
Ctrl+C  # In each terminal

# Or force kill processes
npx kill-port 3001    # Backend port
npx kill-port 8080    # Frontend port (dev & prod)
npx kill-port 5555    # Prisma Studio port
```

## 📊 View Logs

### Production Logs
```bash
# Application logs
sudo journalctl -u nginx-love-backend -f    # Backend logs
sudo journalctl -u nginx-love-frontend -f   # Frontend logs
tail -f /var/log/nginx-love-backend.log      # Backend log file
tail -f /var/log/nginx-love-frontend.log     # Frontend log file

# System logs
tail -f /var/log/nginx/access.log           # Nginx access logs
tail -f /var/log/nginx/error.log            # Nginx error logs
tail -f /var/log/modsec_audit.log           # ModSecurity audit logs

# Log rotation and management
sudo logrotate -f /etc/logrotate.d/nginx-love
ls -la /var/log/nginx-love-*.log*
```

### Development Logs
```bash
# Real-time logs
tail -f /tmp/backend.log     # Backend development logs
tail -f /tmp/frontend.log    # Frontend development logs

# Application-specific logs
cd apps/api && pnpm dev    # Shows real-time backend logs
cd apps/web && pnpm dev    # Shows real-time frontend logs + HMR

# Combined log viewing
multitail /tmp/backend.log /tmp/frontend.log
```

## 🐛 Troubleshooting

### Port Conflicts
```bash
# Check what's using ports
sudo netstat -tulnp | grep :3001    # Backend port
sudo netstat -tulnp | grep :8080    # Frontend port (dev & prod)

# Kill processes on specific ports
sudo lsof -ti:3001 | xargs kill -9  # Backend
sudo lsof -ti:8080 | xargs kill -9  # Frontend (dev & prod)
sudo lsof -ti:5555 | xargs kill -9  # Prisma Studio

# Alternative method
sudo fuser -k 3001/tcp
sudo fuser -k 8080/tcp
```

### Database Issues
```bash
# Check database file
ls -lh apps/api/prisma/nginx_waf.db
sqlite3 apps/api/prisma/nginx_waf.db ".tables"

# Reset database (WARNING: deletes all data)
cd apps/api
rm -f prisma/nginx_waf.db prisma/nginx_waf.db-journal
pnpm prisma migrate dev        # Recreate and migrate
pnpm prisma:seed               # Reseed with initial data

# Regenerate Prisma client
pnpm prisma generate

# Check environment variables
cat apps/api/.env | grep DATABASE_URL
cd apps/api && node -e "console.log(process.env.DATABASE_URL)"

# Backup database
cp apps/api/prisma/nginx_waf.db apps/api/prisma/nginx_waf.db.backup-$(date +%Y%m%d)

# Restore database
cp apps/api/prisma/nginx_waf.db.backup-YYYYMMDD apps/api/prisma/nginx_waf.db
```

### Nginx Configuration Issues
```bash
# Test nginx configuration
sudo nginx -t
sudo nginx -T  # Show complete configuration

# Check ModSecurity status
sudo tail -f /var/log/nginx/error.log | grep -i modsec

# Verify SSL certificates
sudo openssl x509 -in /etc/nginx/ssl/domain.crt -text -noout

# Check upstream connectivity
curl -I http://localhost:3001/api/health
```

### Performance Issues
```bash
# Check system resources
htop
df -h
free -h

# Check application memory usage
ps aux | grep node | grep -v grep

# Database file size
du -h apps/api/prisma/nginx_waf.db
```

### Common Error Solutions

**Error: "EADDRINUSE: address already in use"**
```bash
# Find and kill the process
sudo lsof -i :3001
sudo kill -9 <PID>
```

**Error: "Database connection failed"**
```bash
# Check if database file exists
ls -l apps/api/prisma/nginx_waf.db

# Check DATABASE_URL environment variable
cat apps/api/.env | grep DATABASE_URL

# Recreate database if corrupted
cd apps/api
rm -f prisma/nginx_waf.db prisma/nginx_waf.db-journal
pnpm prisma migrate dev
pnpm prisma:seed
```

**Error: "ModSecurity failed to load"**
```bash
# Check ModSecurity installation
nginx -V 2>&1 | grep -o with-compat
ls -la /etc/nginx/modules/
sudo nginx -t
```

**Error: "SSL certificate not found"**
```bash
# Check certificate files
sudo ls -la /etc/nginx/ssl/
# Regenerate certificates
sudo /root/.acme.sh/acme.sh --renew -d yourdomain.com --force
```

## Development Workflow

### Setting up Development Environment
```bash
# 1. Fork and clone repository
git clone https://github.com/TinyActive/nginx-love.git
cd nginx-love

# 2. Install dependencies
pnpm install

# 3. Setup database
cd apps/api
cp .env.example .env          # Configure environment variables
# Edit .env and set DATABASE_URL="file:./nginx_waf.db"
pnpm prisma:migrate        # Run database migrations
pnpm prisma:seed          # Seed initial data

# 4. Start development servers
cd apps/web && pnpm dev    # Frontend (Terminal 1)
cd apps/api && pnpm dev     # Backend (Terminal 2)
```

### Code Quality & Standards
```bash
# Linting and formatting
pnpm lint                  # ESLint check
pnpm lint:fix             # Auto-fix ESLint issues

# Type checking
cd apps/api && npx tsc --noEmit    # TypeScript check
npx tsc --noEmit                  # Frontend TypeScript check

# Database operations
cd apps/api
pnpm prisma:studio        # Database GUI
pnpm prisma:generate      # Regenerate Prisma client
pnpm prisma:migrate       # Create new migration
```

### Testing
```bash
# Unit tests (future implementation)
pnpm test                     # Frontend tests
cd apps/api && pnpm test       # Backend tests

# API testing
curl -X GET http://localhost:3001/api/health
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📝 Contributing

1. **Fork the repository**
   ```bash
   git clone https://github.com/YourUsername/nginx-love.git
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make changes following conventions**
   - Use TypeScript for type safety
   - Follow existing code style
   - Add JSDoc comments for functions
   - Update database schema via Prisma migrations
   - Test API endpoints manually

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

### Commit Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Build/config changes

## 📄 License

This project is licensed under the **License** - see the [LICENSE](LICENSE) file for details.

## 👥 Support & Community

### Getting Help
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/TinyActive/nginx-love/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/TinyActive/nginx-love/discussions)
- 📚 **Documentation**: [Project Wiki](https://github.com/TinyActive/nginx-love/wiki)
- 💬 **Community**: [Telegram Support](https://t.me/nginxlove)

### Security Issues
For security vulnerabilities, please email: security@tinyactive.net

### Acknowledgments
- [OWASP ModSecurity Core Rule Set](https://owasp.org/www-project-modsecurity-core-rule-set/)
- [Nginx](https://nginx.org/) & [ModSecurity](https://modsecurity.org/)
- [React](https://reactjs.org/) & [ShadCN UI](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/) & [PostgreSQL](https://www.postgresql.org/)

---

**🔥 Made with ❤️ by TinyActive Team**

⭐ **Star this repository if it helped you!**
