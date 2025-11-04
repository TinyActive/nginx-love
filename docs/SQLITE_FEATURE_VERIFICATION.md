# SQLite Migration - Feature Verification Guide

This document provides a comprehensive checklist to verify all features work correctly after migrating from PostgreSQL to SQLite.

## Overview

The migration to SQLite required converting JSON and array fields to strings. All affected repositories now include:
- **Serialization** - Converting objects/arrays to JSON strings when writing to database
- **Deserialization** - Converting JSON strings back to objects/arrays when reading from database

## Modified Repositories

### 1. Domains Repository ✅
**File**: `src/domains/domains/domains.repository.ts`

**Fields Converted**:
- `customLocations` (Json → String)
- `realIpCustomCidrs` (String[] → String)

**Features to Test**:
- [ ] Create domain with custom locations
- [ ] Create domain with custom Real IP CIDR ranges
- [ ] Update domain custom locations
- [ ] Update domain Real IP settings
- [ ] List all domains (verify custom locations display correctly)
- [ ] View domain details

### 2. SSL Repository ✅
**File**: `src/domains/ssl/ssl.repository.ts`

**Fields Converted**:
- `sans` (String[] → String) - Subject Alternative Names
- `subjectDetails` (Json → String) - Certificate subject info
- `issuerDetails` (Json → String) - Certificate issuer info

**Features to Test**:
- [ ] Upload manual SSL certificate
- [ ] Issue auto SSL certificate (Let's Encrypt)
- [ ] View SSL certificate details (verify SANs display correctly)
- [ ] Renew SSL certificate
- [ ] List all SSL certificates
- [ ] View certificate subject/issuer details

### 3. Access Lists Repository ✅
**File**: `src/domains/access-lists/access-lists.repository.ts`

**Fields Converted**:
- `allowedIps` (String[] → String)

**Features to Test**:
- [ ] Create access list with IP whitelist
- [ ] Create access list with CIDR ranges
- [ ] Update access list IPs
- [ ] Delete access list
- [ ] List all access lists
- [ ] Apply access list to domain

### 4. Account Repository ✅
**File**: `src/domains/account/account.repository.ts`

**Fields Converted**:
- `backupCodes` (String[] → String)

**Features to Test**:
- [ ] Enable 2FA
- [ ] Generate backup codes
- [ ] Use backup code to login
- [ ] Regenerate backup codes
- [ ] View backup codes in profile

### 5. Alerts Repository ✅
**File**: `src/domains/alerts/alerts.repository.ts`

**Fields Converted**:
- `config` (Json → String) - Email, Telegram config

**Features to Test**:
- [ ] Create email notification channel
- [ ] Create Telegram notification channel
- [ ] Update notification channel config
- [ ] Test notification channel
- [ ] Create alert rule with notification
- [ ] Trigger alert and verify notification sent

### 6. Backup Service ✅
**File**: `src/domains/backup/backup.service.ts`

**Fields Converted**:
- `metadata` (Json → String)

**Features to Test**:
- [ ] Create manual backup
- [ ] Create scheduled backup
- [ ] List all backups (verify metadata displays)
- [ ] Restore from backup
- [ ] Download backup file
- [ ] Delete backup

## Critical Test Scenarios

### Scenario 1: Domain with Full Configuration
1. Create domain with:
   - Upstreams
   - Load balancer
   - Custom locations (multiple location blocks)
   - Real IP with custom CIDRs
   - SSL certificate
   - Access list
2. Verify all settings save correctly
3. Update each setting
4. Delete domain

### Scenario 2: SSL Certificate Management
1. Upload manual SSL with multiple SANs
2. Verify certificate details show all SANs
3. Verify subject/issuer details display
4. Auto-renew certificate
5. Verify renewal preserves all details

### Scenario 3: Access Control
1. Create access list with:
   - Multiple IP addresses
   - Multiple CIDR ranges
   - Basic auth users
2. Apply to multiple domains
3. Update IP list
4. Test access from allowed/blocked IPs

### Scenario 4: Notifications & Alerts
1. Create email notification channel
2. Create Telegram notification channel
3. Create alert rules for:
   - Domain down
   - SSL expiring
   - High traffic
4. Trigger alerts
5. Verify notifications sent correctly

### Scenario 5: Backup & Restore
1. Create full system backup
2. Make changes to system
3. Restore from backup
4. Verify all data restored:
   - Domains with custom locations
   - SSL certificates with SANs
   - Access lists with IPs
   - Notification channels with config

## Verification Commands

### Check Database File
```bash
# Verify SQLite database exists
ls -lh apps/api/prisma/nginx_waf.db

# Check database size
du -h apps/api/prisma/nginx_waf.db
```

### Verify JSON Fields
```bash
# Connect to SQLite database
sqlite3 apps/api/prisma/nginx_waf.db

# Check domains with custom locations
SELECT id, name, customLocations FROM Domain WHERE customLocations IS NOT NULL LIMIT 5;

# Check SSL certificates with SANs
SELECT id, commonName, sans FROM SSLCertificate LIMIT 5;

# Check access lists with IPs
SELECT id, name, allowedIps FROM AccessList LIMIT 5;

# Check notification channels with config
SELECT id, name, type, config FROM NotificationChannel LIMIT 5;

# Exit
.quit
```

### Check Application Logs
```bash
# Monitor backend logs
tail -f apps/api/logs/app.log

# Check for JSON parse errors
grep -i "json\|parse\|serialize" apps/api/logs/app.log
```

## Common Issues & Solutions

### Issue 1: Empty Arrays/Objects Display as Strings
**Symptom**: UI shows `"[]"` or `"{}"` instead of empty state

**Cause**: Frontend not handling deserialized data correctly

**Solution**: Check that API returns properly parsed data, not JSON strings

### Issue 2: Cannot Save Custom Locations
**Symptom**: Error when creating domain with custom locations

**Cause**: Data not being serialized before database write

**Solution**: Verify `domains.repository.ts` uses `JSON.stringify()` on create/update

### Issue 3: SANs Not Displaying
**Symptom**: SSL certificate shows empty SANs array

**Cause**: Data not being deserialized when reading from database

**Solution**: Verify `ssl.repository.ts` uses `transformSSLCertificate()` on all reads

### Issue 4: Notification Config Lost
**Symptom**: Notification channel loses email/Telegram config after save

**Cause**: Config not being serialized/deserialized properly

**Solution**: Verify `alerts.repository.ts` uses serialize/deserialize helpers

## Migration Rollback

If critical issues are found:

1. **Stop Services**:
   ```bash
   sudo systemctl stop nginx-love-backend nginx-love-frontend
   ```

2. **Restore PostgreSQL Config**:
   ```bash
   cp backups/postgres-to-sqlite-*/. env.backup apps/api/.env
   ```

3. **Remove SQLite Database**:
   ```bash
   rm apps/api/prisma/nginx_waf.db
   ```

4. **Start PostgreSQL**:
   ```bash
   docker start nginx-love-postgres
   ```

5. **Restart Services**:
   ```bash
   sudo systemctl start nginx-love-backend nginx-love-frontend
   ```

## Success Criteria

Mark this migration as successful when:

- [ ] All domain operations work (create, update, delete)
- [ ] SSL certificate management works (upload, renew, view)
- [ ] Access lists work (create, update, apply)
- [ ] 2FA and backup codes work
- [ ] Notification channels work (email, Telegram)
- [ ] Alerts trigger and send notifications
- [ ] Backups create and restore successfully
- [ ] ModSecurity rules apply correctly
- [ ] No JSON parse/serialize errors in logs
- [ ] Build completes with 0 errors
- [ ] All UI features display data correctly

## Performance Benchmarks

Compare before/after migration:

| Operation | PostgreSQL | SQLite | Notes |
|-----------|-----------|---------|-------|
| List 100 domains | - | - | Should be similar |
| Create domain | - | - | Should be similar |
| SSL upload | - | - | Should be similar |
| Backup creation | - | - | May be faster |
| Full restore | - | - | May be faster |

## Reporting Issues

If you find issues:

1. Document the exact steps to reproduce
2. Include error messages from logs
3. Note which feature is affected
4. Check if data is correctly stored in database (use sqlite3 commands above)
5. Report to GitHub issue or PR comments

## Additional Resources

- Main Migration Guide: `docs/MIGRATION_POSTGRES_TO_SQLITE.md`
- Build Fixes Status: `docs/SQLITE_BUILD_FIXES_STATUS.md`
- Prisma Schema: `apps/api/prisma/schema.prisma`
