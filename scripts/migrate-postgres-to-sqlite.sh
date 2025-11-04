#!/bin/bash

################################################################################
# Nginx Love UI - PostgreSQL to SQLite Migration Script
# Description: Migrate existing PostgreSQL data to SQLite
# Version: 1.0.0
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/apps/api"
BACKUP_DIR="$PROJECT_DIR/backups/postgres-to-sqlite-$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$BACKUP_DIR/migration.log"

# Logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "=================================="
log "PostgreSQL to SQLite Migration"
log "=================================="
log ""
log "Backup directory: $BACKUP_DIR"

# Check if running as root (for production deployments)
if [[ "${EUID}" -eq 0 ]]; then
    warn "Running as root - will backup database files"
fi

# Step 1: Check prerequisites
log "Step 1/6: Checking prerequisites..."

cd "$BACKEND_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    error ".env file not found in $BACKEND_DIR"
fi

# Get current DATABASE_URL
CURRENT_DB_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')

if [[ ! "$CURRENT_DB_URL" =~ ^postgresql:// ]]; then
    warn "Current DATABASE_URL does not appear to be PostgreSQL"
    info "Current DATABASE_URL: $CURRENT_DB_URL"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Migration cancelled by user"
    fi
fi

log "✓ Current database: PostgreSQL"
log "✓ Prerequisites check passed"

# Step 2: Backup current .env
log "Step 2/6: Backing up current configuration..."

cp .env "$BACKUP_DIR/.env.backup"
log "✓ Backed up .env to $BACKUP_DIR/.env.backup"

# Step 3: Export data from PostgreSQL
log "Step 3/6: Exporting data from PostgreSQL..."

cat > "$BACKUP_DIR/export-postgres-data.ts" <<'EOF'
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  console.log('📤 Exporting data from PostgreSQL...');
  
  const exportDir = process.argv[2] || './export';
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const data: any = {};

  // Export all tables in dependency order
  console.log('Exporting users...');
  data.users = await prisma.user.findMany({
    include: {
      profile: true,
      twoFactor: true,
    }
  });

  console.log('Exporting activity logs...');
  data.activityLogs = await prisma.activityLog.findMany();

  console.log('Exporting refresh tokens...');
  data.refreshTokens = await prisma.refreshToken.findMany();

  console.log('Exporting user sessions...');
  data.userSessions = await prisma.userSession.findMany();

  console.log('Exporting domains...');
  data.domains = await prisma.domain.findMany({
    include: {
      upstreams: true,
      loadBalancer: true,
      sslCertificate: true,
    }
  });

  console.log('Exporting ModSecurity CRS rules...');
  data.modSecCRSRules = await prisma.modSecCRSRule.findMany();

  console.log('Exporting ModSecurity custom rules...');
  data.modSecRules = await prisma.modSecRule.findMany();

  console.log('Exporting nginx configs...');
  data.nginxConfigs = await prisma.nginxConfig.findMany();

  console.log('Exporting installation status...');
  data.installationStatus = await prisma.installationStatus.findMany();

  console.log('Exporting notification channels...');
  data.notificationChannels = await prisma.notificationChannel.findMany();

  console.log('Exporting alert rules...');
  data.alertRules = await prisma.alertRule.findMany({
    include: {
      channels: {
        include: {
          channel: true,
        }
      }
    }
  });

  console.log('Exporting alert history...');
  data.alertHistory = await prisma.alertHistory.findMany();

  console.log('Exporting ACL rules...');
  data.aclRules = await prisma.aclRule.findMany();

  console.log('Exporting access lists...');
  data.accessLists = await prisma.accessList.findMany({
    include: {
      authUsers: true,
      domains: true,
    }
  });

  console.log('Exporting performance metrics...');
  data.performanceMetrics = await prisma.performanceMetric.findMany();

  console.log('Exporting backup schedules...');
  data.backupSchedules = await prisma.backupSchedule.findMany({
    include: {
      backups: true,
    }
  });

  console.log('Exporting slave nodes...');
  data.slaveNodes = await prisma.slaveNode.findMany();

  console.log('Exporting system config...');
  data.systemConfigs = await prisma.systemConfig.findMany();

  console.log('Exporting sync logs...');
  data.syncLogs = await prisma.syncLog.findMany();

  console.log('Exporting config versions...');
  data.configVersions = await prisma.configVersion.findMany();

  console.log('Exporting network load balancers...');
  data.networkLoadBalancers = await prisma.networkLoadBalancer.findMany({
    include: {
      upstreams: true,
      healthChecks: true,
    }
  });

  // Save to JSON file
  const exportFile = path.join(exportDir, 'postgres-export.json');
  fs.writeFileSync(exportFile, JSON.stringify(data, null, 2));
  
  console.log(`✅ Data exported to ${exportFile}`);
  console.log(`📊 Total records exported: ${JSON.stringify(data).length} bytes`);
  
  await prisma.$disconnect();
}

exportData().catch((error) => {
  console.error('❌ Export failed:', error);
  process.exit(1);
});
EOF

# Run export
info "Running data export from PostgreSQL..."
pnpm ts-node "$BACKUP_DIR/export-postgres-data.ts" "$BACKUP_DIR" >> "$LOG_FILE" 2>&1 || error "Failed to export data from PostgreSQL"

log "✓ Data exported successfully to $BACKUP_DIR/postgres-export.json"

# Step 4: Update Prisma schema and generate new SQLite client
log "Step 4/6: Preparing SQLite database..."

# Update DATABASE_URL in .env
SQLITE_DB_PATH="$BACKEND_DIR/prisma/nginx_waf.db"
sed -i.migration_backup "s|^DATABASE_URL=.*|DATABASE_URL=\"file:./nginx_waf.db\"|g" .env

log "✓ Updated DATABASE_URL to use SQLite"

# Generate Prisma client and run migrations
info "Generating Prisma client for SQLite..."
pnpm prisma generate >> "$LOG_FILE" 2>&1 || error "Failed to generate Prisma client"

info "Running SQLite migrations..."
pnpm prisma migrate deploy >> "$LOG_FILE" 2>&1 || error "Failed to run migrations"

log "✓ SQLite database created and migrated"

# Step 5: Import data into SQLite
log "Step 5/6: Importing data into SQLite..."

cat > "$BACKUP_DIR/import-sqlite-data.ts" <<'EOF'
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper function to convert enum arrays to strings
function convertEnumsToStrings(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => convertEnumsToStrings(item));
  } else if (data && typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert arrays to JSON strings for SQLite
      if (Array.isArray(value) && typeof value[0] === 'string') {
        converted[key] = JSON.stringify(value);
      }
      // Convert objects to JSON strings for SQLite
      else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        if (key.endsWith('Details') || key === 'config' || key === 'metadata' || key === 'configData') {
          converted[key] = JSON.stringify(value);
        } else {
          converted[key] = convertEnumsToStrings(value);
        }
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }
  return data;
}

async function importData() {
  console.log('📥 Importing data into SQLite...');
  
  const importFile = path.join(process.argv[2] || './export', 'postgres-export.json');
  
  if (!fs.existsSync(importFile)) {
    throw new Error(`Import file not found: ${importFile}`);
  }

  const rawData = JSON.parse(fs.readFileSync(importFile, 'utf-8'));
  const data = convertEnumsToStrings(rawData);

  // Import in dependency order
  
  // 1. Users (without relations first)
  console.log('Importing users...');
  for (const user of data.users) {
    const { profile, twoFactor, activities, refreshTokens, sessions, ...userData } = user;
    await prisma.user.create({ data: userData });
  }

  // 2. User profiles
  console.log('Importing user profiles...');
  for (const user of data.users) {
    if (user.profile) {
      await prisma.userProfile.create({ data: user.profile });
    }
  }

  // 3. Two-factor auth
  console.log('Importing two-factor auth...');
  for (const user of data.users) {
    if (user.twoFactor) {
      await prisma.twoFactorAuth.create({ data: user.twoFactor });
    }
  }

  // 4. Activity logs
  console.log('Importing activity logs...');
  for (const log of data.activityLogs) {
    await prisma.activityLog.create({ data: log });
  }

  // 5. Refresh tokens
  console.log('Importing refresh tokens...');
  for (const token of data.refreshTokens) {
    await prisma.refreshToken.create({ data: token });
  }

  // 6. User sessions
  console.log('Importing user sessions...');
  for (const session of data.userSessions) {
    await prisma.userSession.create({ data: session });
  }

  // 7. Domains (without relations)
  console.log('Importing domains...');
  for (const domain of data.domains) {
    const { upstreams, loadBalancer, sslCertificate, modsecCRSRules, modsecRules, accessLists, ...domainData } = domain;
    await prisma.domain.create({ data: domainData });
  }

  // 8. Upstreams
  console.log('Importing upstreams...');
  for (const domain of data.domains) {
    if (domain.upstreams) {
      for (const upstream of domain.upstreams) {
        await prisma.upstream.create({ data: upstream });
      }
    }
  }

  // 9. Load balancer configs
  console.log('Importing load balancer configs...');
  for (const domain of data.domains) {
    if (domain.loadBalancer) {
      await prisma.loadBalancerConfig.create({ data: domain.loadBalancer });
    }
  }

  // 10. SSL certificates
  console.log('Importing SSL certificates...');
  for (const domain of data.domains) {
    if (domain.sslCertificate) {
      await prisma.sSLCertificate.create({ data: domain.sslCertificate });
    }
  }

  // 11. ModSecurity CRS rules
  console.log('Importing ModSecurity CRS rules...');
  for (const rule of data.modSecCRSRules) {
    await prisma.modSecCRSRule.create({ data: rule });
  }

  // 12. ModSecurity custom rules
  console.log('Importing ModSecurity custom rules...');
  for (const rule of data.modSecRules) {
    await prisma.modSecRule.create({ data: rule });
  }

  // 13. Nginx configs
  console.log('Importing nginx configs...');
  for (const config of data.nginxConfigs) {
    await prisma.nginxConfig.create({ data: config });
  }

  // 14. Installation status
  console.log('Importing installation status...');
  for (const status of data.installationStatus) {
    await prisma.installationStatus.create({ data: status });
  }

  // 15. Notification channels
  console.log('Importing notification channels...');
  for (const channel of data.notificationChannels) {
    await prisma.notificationChannel.create({ data: channel });
  }

  // 16. Alert rules (without relations)
  console.log('Importing alert rules...');
  for (const rule of data.alertRules) {
    const { channels, ...ruleData } = rule;
    await prisma.alertRule.create({ data: ruleData });
  }

  // 17. Alert rule channels
  console.log('Importing alert rule channels...');
  for (const rule of data.alertRules) {
    if (rule.channels) {
      for (const channel of rule.channels) {
        await prisma.alertRuleChannel.create({ data: channel });
      }
    }
  }

  // 18. Alert history
  console.log('Importing alert history...');
  for (const alert of data.alertHistory) {
    await prisma.alertHistory.create({ data: alert });
  }

  // 19. ACL rules
  console.log('Importing ACL rules...');
  for (const rule of data.aclRules) {
    await prisma.aclRule.create({ data: rule });
  }

  // 20. Access lists (without relations)
  console.log('Importing access lists...');
  for (const list of data.accessLists) {
    const { authUsers, domains, ...listData } = list;
    await prisma.accessList.create({ data: listData });
  }

  // 21. Access list auth users
  console.log('Importing access list auth users...');
  for (const list of data.accessLists) {
    if (list.authUsers) {
      for (const user of list.authUsers) {
        await prisma.accessListAuthUser.create({ data: user });
      }
    }
  }

  // 22. Access list domains
  console.log('Importing access list domains...');
  for (const list of data.accessLists) {
    if (list.domains) {
      for (const domain of list.domains) {
        await prisma.accessListDomain.create({ data: domain });
      }
    }
  }

  // 23. Performance metrics
  console.log('Importing performance metrics...');
  for (const metric of data.performanceMetrics) {
    await prisma.performanceMetric.create({ data: metric });
  }

  // 24. Backup schedules (without relations)
  console.log('Importing backup schedules...');
  for (const schedule of data.backupSchedules) {
    const { backups, ...scheduleData } = schedule;
    await prisma.backupSchedule.create({ data: scheduleData });
  }

  // 25. Backup files
  console.log('Importing backup files...');
  for (const schedule of data.backupSchedules) {
    if (schedule.backups) {
      for (const backup of schedule.backups) {
        await prisma.backupFile.create({ data: backup });
      }
    }
  }

  // 26. Slave nodes
  console.log('Importing slave nodes...');
  for (const node of data.slaveNodes) {
    await prisma.slaveNode.create({ data: node });
  }

  // 27. System config
  console.log('Importing system config...');
  for (const config of data.systemConfigs) {
    await prisma.systemConfig.create({ data: config });
  }

  // 28. Sync logs
  console.log('Importing sync logs...');
  for (const log of data.syncLogs) {
    await prisma.syncLog.create({ data: log });
  }

  // 29. Config versions
  console.log('Importing config versions...');
  for (const version of data.configVersions) {
    await prisma.configVersion.create({ data: version });
  }

  // 30. Network load balancers (without relations)
  console.log('Importing network load balancers...');
  for (const nlb of data.networkLoadBalancers) {
    const { upstreams, healthChecks, ...nlbData } = nlb;
    await prisma.networkLoadBalancer.create({ data: nlbData });
  }

  // 31. NLB upstreams
  console.log('Importing NLB upstreams...');
  for (const nlb of data.networkLoadBalancers) {
    if (nlb.upstreams) {
      for (const upstream of nlb.upstreams) {
        await prisma.nLBUpstream.create({ data: upstream });
      }
    }
  }

  // 32. NLB health checks
  console.log('Importing NLB health checks...');
  for (const nlb of data.networkLoadBalancers) {
    if (nlb.healthChecks) {
      for (const check of nlb.healthChecks) {
        await prisma.nLBHealthCheck.create({ data: check });
      }
    }
  }

  console.log('✅ Data imported successfully into SQLite');
  
  await prisma.$disconnect();
}

importData().catch((error) => {
  console.error('❌ Import failed:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});
EOF

# Run import
info "Running data import into SQLite..."
pnpm ts-node "$BACKUP_DIR/import-sqlite-data.ts" "$BACKUP_DIR" >> "$LOG_FILE" 2>&1 || {
    error "Failed to import data into SQLite. Restoring PostgreSQL configuration..."
    cp "$BACKUP_DIR/.env.backup" .env
    exit 1
}

log "✓ Data imported successfully into SQLite"

# Step 6: Verification and cleanup
log "Step 6/6: Verification and cleanup..."

# Verify SQLite database
if [ ! -f "$SQLITE_DB_PATH" ]; then
    error "SQLite database file not found at $SQLITE_DB_PATH"
fi

SQLITE_SIZE=$(du -h "$SQLITE_DB_PATH" | cut -f1)
log "✓ SQLite database created: $SQLITE_SIZE"

# Final summary
log ""
log "=================================="
log "Migration Completed Successfully!"
log "=================================="
log ""
log "📋 Summary:"
log "  • Old database: PostgreSQL"
log "  • New database: SQLite ($SQLITE_SIZE)"
log "  • Database location: $SQLITE_DB_PATH"
log "  • Backup location: $BACKUP_DIR"
log ""
log "📝 Next Steps:"
log "  1. Test the application with SQLite database"
log "  2. If everything works, you can remove PostgreSQL:"
log "     - Stop PostgreSQL container: docker stop nginx-love-postgres"
log "     - Remove PostgreSQL container: docker rm nginx-love-postgres"
log "     - Remove PostgreSQL volume: docker volume rm nginx-love-postgres-data"
log "  3. Keep backup for safety: $BACKUP_DIR"
log ""
log "⚠️  Important:"
log "  • Original .env backed up to: $BACKUP_DIR/.env.backup"
log "  • PostgreSQL export saved to: $BACKUP_DIR/postgres-export.json"
log "  • Migration log saved to: $LOG_FILE"
log ""
log "🔄 To rollback (if needed):"
log "  1. Stop the application"
log "  2. Restore .env: cp $BACKUP_DIR/.env.backup $BACKEND_DIR/.env"
log "  3. Delete SQLite database: rm $SQLITE_DB_PATH"
log "  4. Start PostgreSQL container"
log "  5. Restart the application"
log ""
log "Migration completed at: $(date)"
log "=================================="
