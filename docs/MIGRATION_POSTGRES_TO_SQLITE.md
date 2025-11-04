# PostgreSQL to SQLite Migration Guide

This guide explains how to migrate your existing Nginx Love installation from PostgreSQL to SQLite without losing any data.

## Prerequisites

- Existing Nginx Love installation running with PostgreSQL
- Backup of your PostgreSQL database (recommended)
- Root or sudo access to the server
- At least 1GB of free disk space for backups

## Migration Process

### Step 1: Backup Your Current System

Before starting the migration, create a manual backup:

```bash
# Backup PostgreSQL using pg_dump (optional but recommended)
docker exec nginx-love-postgres pg_dump -U nginx_love_user nginx_love_db > /root/postgres-backup-$(date +%Y%m%d).sql

# Or use the application's built-in backup feature
# Navigate to Settings > Backup & Restore in the web interface
```

### Step 2: Run the Migration Script

The migration script will automatically:
1. Export all data from PostgreSQL to JSON
2. Update the Prisma schema to use SQLite
3. Create a new SQLite database
4. Import all data from PostgreSQL into SQLite
5. Backup your original configuration

```bash
cd /path/to/nginx-love
sudo bash scripts/migrate-postgres-to-sqlite.sh
```

**What the script does:**
- Exports all database tables to `backups/postgres-to-sqlite-YYYYMMDD_HHMMSS/postgres-export.json`
- Backs up your current `.env` file
- Updates `DATABASE_URL` to use SQLite
- Creates a new SQLite database at `apps/api/prisma/nginx_waf.db`
- Imports all data with proper type conversions
- Generates a detailed migration log

### Step 3: Restart the Application

After migration completes successfully:

```bash
# Restart backend service
sudo systemctl restart nginx-love-backend

# Restart frontend service  
sudo systemctl restart nginx-love-frontend

# Check service status
sudo systemctl status nginx-love-backend
sudo systemctl status nginx-love-frontend
```

### Step 4: Verify the Migration

1. **Check the web interface:**
   - Navigate to http://YOUR_SERVER_IP:8080
   - Log in with your credentials
   - Verify all data is present:
     - Users and profiles
     - Domains and upstreams
     - SSL certificates
     - ModSecurity rules
     - Access lists
     - Performance metrics
     - Alert rules and history

2. **Check the database file:**
   ```bash
   ls -lh /path/to/apps/api/prisma/nginx_waf.db
   
   # Verify database integrity
   sqlite3 /path/to/apps/api/prisma/nginx_waf.db "PRAGMA integrity_check;"
   ```

3. **Review migration logs:**
   ```bash
   cat /path/to/backups/postgres-to-sqlite-*/migration.log
   ```

### Step 5: Clean Up PostgreSQL (Optional)

Once you've verified everything works correctly with SQLite, you can optionally remove PostgreSQL:

```bash
# Stop PostgreSQL container
docker stop nginx-love-postgres

# Remove PostgreSQL container
docker rm nginx-love-postgres

# Remove PostgreSQL volume (WARNING: This deletes the PostgreSQL database permanently)
docker volume rm nginx-love-postgres-data
```

**Note:** Keep your backup directory for at least 30 days in case you need to rollback.

## Rollback Instructions

If you encounter issues after migration, you can rollback to PostgreSQL:

### Step 1: Stop the Application

```bash
sudo systemctl stop nginx-love-backend
sudo systemctl stop nginx-love-frontend
```

### Step 2: Restore PostgreSQL Configuration

```bash
cd /path/to/nginx-love/apps/api

# Find your backup directory
BACKUP_DIR=$(ls -td ../backups/postgres-to-sqlite-* | head -1)

# Restore .env file
cp "$BACKUP_DIR/.env.backup" .env

# Delete SQLite database
rm -f prisma/nginx_waf.db prisma/nginx_waf.db-journal
```

### Step 3: Start PostgreSQL Container

```bash
# If you stopped but didn't remove the container
docker start nginx-love-postgres

# Wait for PostgreSQL to be ready
sleep 10
```

### Step 4: Restart the Application

```bash
sudo systemctl start nginx-love-backend
sudo systemctl start nginx-love-frontend
```

## Data Type Conversions

The migration script automatically handles the following conversions:

### Enums → Strings
All enum types are converted to string values:
```
UserRole: "admin", "moderator", "viewer"
UserStatus: "active", "inactive", "suspended"
DomainStatus: "active", "inactive", "error"
... (24 enums total)
```

### JSON Fields → Strings
JSON data is serialized to strings:
```
SSLCertificate.subjectDetails: JSON object → JSON string
NotificationChannel.config: JSON object → JSON string
Domain.customLocations: JSON object → JSON string
```

### Arrays → Strings
Array fields are converted to JSON strings:
```
TwoFactorAuth.backupCodes: ["code1", "code2"] → '["code1", "code2"]'
SSLCertificate.sans: ["domain1", "domain2"] → '["domain1", "domain2"]'
Domain.realIpCustomCidrs: ["10.0.0.0/8"] → '["10.0.0.0/8"]'
```

## Troubleshooting

### Migration Script Fails

**Error: "Failed to export data from PostgreSQL"**
- **Cause:** PostgreSQL is not running or DATABASE_URL is incorrect
- **Solution:** 
  ```bash
  docker ps | grep postgres  # Check if container is running
  docker start nginx-love-postgres  # Start if stopped
  cat apps/api/.env | grep DATABASE_URL  # Verify connection string
  ```

**Error: "Failed to import data into SQLite"**
- **Cause:** Data type conversion issue or disk space
- **Solution:**
  ```bash
  df -h  # Check disk space
  # Review import log for specific errors
  cat backups/postgres-to-sqlite-*/migration.log
  # The script automatically restores PostgreSQL config on import failure
  ```

### Post-Migration Issues

**Application won't start after migration**
- Check logs: `sudo journalctl -u nginx-love-backend -f`
- Verify DATABASE_URL: `cat apps/api/.env | grep DATABASE_URL`
- Should be: `DATABASE_URL="file:./nginx_waf.db"`

**Data is missing after migration**
- Check migration log for errors: `cat backups/postgres-to-sqlite-*/migration.log`
- Verify exported data: `cat backups/postgres-to-sqlite-*/postgres-export.json`
- If data was exported but not imported, you can re-run just the import:
  ```bash
  cd apps/api
  pnpm ts-node /path/to/backups/postgres-to-sqlite-*/import-sqlite-data.ts /path/to/backups/postgres-to-sqlite-*
  ```

**Performance issues**
- SQLite is slower for large datasets with many concurrent writes
- Recommended for deployments with < 100 domains and < 10 concurrent users
- For larger deployments, consider keeping PostgreSQL

## Performance Considerations

### When to Use SQLite
✅ **Good for:**
- Small to medium deployments (< 100 domains)
- Low concurrent user count (< 10 users)
- Development and testing environments
- Single-server deployments
- Easy backup/restore requirements

### When to Keep PostgreSQL
⚠️ **Consider PostgreSQL if:**
- Large deployment (> 100 domains)
- High concurrent user count (> 10 users)
- High-availability requirements
- Multi-server/cluster deployments
- Heavy write operations

## Support

If you encounter issues during migration:

1. **Check the migration log:**
   ```bash
   cat /path/to/backups/postgres-to-sqlite-*/migration.log
   ```

2. **Review the backup:**
   - Original .env: `backups/postgres-to-sqlite-*/backup`
   - Exported data: `backups/postgres-to-sqlite-*/postgres-export.json`

3. **Community support:**
   - GitHub Issues: https://github.com/TinyActive/nginx-love/issues
   - Telegram: https://t.me/nginxlove

4. **Always keep backups:**
   - Keep the backup directory for at least 30 days
   - Test rollback procedure before deleting PostgreSQL data

## FAQ

**Q: Will this affect my running services?**
A: Yes, the application will need to be restarted after migration. Plan for a brief maintenance window (5-15 minutes).

**Q: Can I migrate back to PostgreSQL later?**
A: Yes, you can rollback using the backup created during migration. However, any data created after migration will need to be manually exported.

**Q: How long does migration take?**
A: Typically 2-5 minutes for small databases (< 1000 records), up to 15 minutes for larger databases.

**Q: Will my SSL certificates and configurations be preserved?**
A: Yes, all data including SSL certificates, domain configurations, ModSecurity rules, and access lists are preserved.

**Q: Do I need to reconfigure anything after migration?**
A: No, all configurations are preserved. Just restart the services and verify everything is working.

## File Locations

After migration:
- **SQLite Database:** `apps/api/prisma/nginx_waf.db`
- **Backup Directory:** `backups/postgres-to-sqlite-YYYYMMDD_HHMMSS/`
- **Migration Log:** `backups/postgres-to-sqlite-YYYYMMDD_HHMMSS/migration.log`
- **Exported Data:** `backups/postgres-to-sqlite-YYYYMMDD_HHMMSS/postgres-export.json`
- **Original .env:** `backups/postgres-to-sqlite-YYYYMMDD_HHMMSS/.env.backup`
