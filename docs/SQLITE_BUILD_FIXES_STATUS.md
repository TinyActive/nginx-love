# SQLite Migration - Build Fixes Status

## Overview

The PostgreSQL to SQLite migration required extensive TypeScript code changes to handle SQLite's limitations with enums, JSON fields, and arrays.

## Progress

**Build Errors**: 31 → 11 (65% complete)

## Completed Fixes

### 1. Enum Types (✅ COMPLETE)
- Created `src/shared/types/enums.ts` with all 24 enum definitions
- Updated imports in `account.repository.ts` and `auth.repository.ts`
- Modified `createActivityLog` to accept string literals
- Added type assertions in `users.repository.ts`

### 2. Array Serialization (✅ COMPLETE)
**Access Lists:**
- `allowedIps`: String[] → String (JSON serialized)
- Added helper functions: `serializeArray()`, `deserializeArray()`
- Transform function for repository returns

**Domains:**
- `realIpCustomCidrs`: String[] → String (JSON serialized)

**Account:**
- `backupCodes`: String[] → String (JSON serialized)

**Cluster/SSL:**
- `sans`: String[] → String (JSON serialized)

### 3. JSON Fields (✅ PARTIAL)
**Backup Service:**
- `metadata`: Object → String (JSON serialized)

### 4. Type Assertions (✅ COMPLETE)
- All user repository methods
- Cluster repository (partial)

## Remaining Issues (11 errors)

### 1. SSL Certificate Deserialization
**Files affected:**
- `domains/backup/backup.service.ts` (line 515)
- `domains/cluster/cluster.repository.ts` (line 232)

**Issue**: SSL certificates from database have `sans` as String, but code expects String[]

**Fix needed**:
```typescript
// In SSL repository or service
const deserializeSans = (sans: string | null): string[] => {
  if (!sans) return [];
  try {
    return JSON.parse(sans);
  } catch {
    return [];
  }
};

// Apply transformation after DB queries
const sslCert = await prisma.sSLCertificate.findUnique(...);
return {
  ...sslCert,
  sans: deserializeSans(sslCert.sans)
};
```

### 2. Domain Nginx Config Service
**File**: `domains/domains/services/nginx-config.service.ts` (line 413)

**Issue**: `realIpCustomCidrs` is String but code calls `.forEach()`

**Fix needed**:
```typescript
// Deserialize before use
const cidrs = JSON.parse(domain.realIpCustomCidrs || '[]');
cidrs.forEach((cidr: string) => {
  // ...
});
```

### 3. SSL Scheduler Service
**File**: `domains/ssl/services/ssl-scheduler.service.ts` (lines 91, 94, 95)

**Issue**: Trying to store String[] and Objects where Prisma expects String

**Fix needed**:
```typescript
await prisma.sSLCertificate.update({
  data: {
    sans: JSON.stringify(sans), // Serialize array
    subjectDetails: JSON.stringify(subjectDetails), // Serialize object
    issuerDetails: JSON.stringify(issuerDetails), // Serialize object
  }
});
```

### 4. Cluster Repository Type Assertions
**File**: `domains/cluster/cluster.repository.ts` (lines 12, 21, 68, 80)

**Issue**: Return types need type assertions

**Fix needed**:
```typescript
async findByName(name: string): Promise<SlaveNode | null> {
  return prisma.slaveNode.findUnique({
    where: { name }
  }) as Promise<SlaveNode | null>;
}
```

## Pattern for Fixes

### For Arrays (String[])
1. **Serialize** when writing to DB: `JSON.stringify(array || [])`
2. **Deserialize** when reading from DB: `JSON.parse(str || '[]')`

### For JSON Objects
1. **Serialize** when writing: `JSON.stringify(object)`
2. **Deserialize** when reading: `JSON.parse(str || '{}')`

### For Enums
1. **Store** as string (no change needed)
2. **Type assert** on read if using custom types

## Recommendations

1. **Create Helper Module**: `src/utils/sqlite-helpers.ts`
   ```typescript
   export const serializeArray = (arr: string[]): string => JSON.stringify(arr || []);
   export const deserializeArray = (str: string | null): string[] => {
     try { return JSON.parse(str || '[]'); }
     catch { return []; }
   };
   
   export const serializeJson = (obj: any): string => JSON.stringify(obj || {});
   export const deserializeJson = <T>(str: string | null): T | null => {
     try { return JSON.parse(str || 'null'); }
     catch { return null; }
   };
   ```

2. **Create Repository Transformers**: For each domain with arrays/JSON
   ```typescript
   const transformSSLCertificate = (cert: PrismaSSLCert): SSLCertificate => ({
     ...cert,
     sans: deserializeArray(cert.sans),
     subjectDetails: deserializeJson(cert.subjectDetails),
     issuerDetails: deserializeJson(cert.issuerDetails),
   });
   ```

3. **Apply Consistently**: Use transformers in all repository methods that return data

## Testing After Fixes

Once all 11 errors are fixed:

```bash
# Test build
cd apps/api && pnpm build

# Run application
pnpm dev

# Test key features:
# - Create/update access lists (array handling)
# - View SSL certificates (sans deserialization)
# - Domain configuration (realIpCustomCidrs)
# - Backup/restore (metadata JSON)
```

## Migration Compatibility

All fixes maintain API compatibility:
- ✅ Input types unchanged (still accept arrays/objects)
- ✅ Output types unchanged (transformers convert back to arrays/objects)
- ✅ Only internal storage format changed (SQLite compatibility)

## Estimated Effort

**Remaining work**: ~1-2 hours for experienced developer

**Files to modify**: 5 files
- backup.service.ts
- cluster.repository.ts  
- nginx-config.service.ts
- ssl-scheduler.service.ts
- Create sqlite-helpers.ts

**Complexity**: Low - mostly repetitive serialize/deserialize calls
