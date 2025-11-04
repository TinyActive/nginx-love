-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "status" TEXT NOT NULL DEFAULT 'active',
    "avatar" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "language" TEXT NOT NULL DEFAULT 'en',
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "two_factor_auth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "method" TEXT NOT NULL DEFAULT 'totp',
    "secret" TEXT,
    "backupCodes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "two_factor_auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "details" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "device" TEXT,
    "location" TEXT,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "sslEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sslExpiry" DATETIME,
    "modsecEnabled" BOOLEAN NOT NULL DEFAULT true,
    "realIpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "realIpCloudflare" BOOLEAN NOT NULL DEFAULT false,
    "realIpCustomCidrs" TEXT NOT NULL DEFAULT '',
    "hstsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "http2Enabled" BOOLEAN NOT NULL DEFAULT true,
    "grpcEnabled" BOOLEAN NOT NULL DEFAULT false,
    "clientMaxBodySize" INTEGER DEFAULT 100,
    "customLocations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "upstreams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "protocol" TEXT NOT NULL DEFAULT 'http',
    "sslVerify" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "maxFails" INTEGER NOT NULL DEFAULT 3,
    "failTimeout" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'checking',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "upstreams_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "load_balancer_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainId" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'round_robin',
    "healthCheckEnabled" BOOLEAN NOT NULL DEFAULT true,
    "healthCheckInterval" INTEGER NOT NULL DEFAULT 30,
    "healthCheckTimeout" INTEGER NOT NULL DEFAULT 5,
    "healthCheckPath" TEXT NOT NULL DEFAULT '/',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "load_balancer_configs_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ssl_certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainId" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "sans" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "subject" TEXT,
    "certificate" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "chain" TEXT,
    "subjectDetails" TEXT,
    "issuerDetails" TEXT,
    "serialNumber" TEXT,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'valid',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ssl_certificates_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "modsec_crs_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainId" TEXT,
    "ruleFile" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "paranoia" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "modsec_crs_rules_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "modsec_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ruleContent" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "modsec_rules_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nginx_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "installation_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "component" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "step" TEXT,
    "message" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "notification_channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "checkInterval" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "alert_rule_channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_rule_channels_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "alert_rules" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "alert_rule_channels_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "notification_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alert_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" DATETIME,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "acl_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "conditionField" TEXT NOT NULL,
    "conditionOperator" TEXT NOT NULL,
    "conditionValue" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "access_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "allowedIps" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "access_list_auth_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessListId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "access_list_auth_users_accessListId_fkey" FOREIGN KEY ("accessListId") REFERENCES "access_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "access_list_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessListId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "access_list_domains_accessListId_fkey" FOREIGN KEY ("accessListId") REFERENCES "access_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "access_list_domains_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" REAL NOT NULL,
    "throughput" REAL NOT NULL,
    "errorRate" REAL NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "backup_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" DATETIME,
    "nextRun" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "backup_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "type" TEXT NOT NULL DEFAULT 'full',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "backup_files_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "backup_schedules" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "slave_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 3001,
    "apiKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "lastSeen" DATETIME,
    "version" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncInterval" INTEGER NOT NULL DEFAULT 60,
    "configHash" TEXT,
    "lastSyncAt" DATETIME,
    "latency" INTEGER,
    "cpuUsage" REAL,
    "memoryUsage" REAL,
    "diskUsage" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeMode" TEXT NOT NULL DEFAULT 'master',
    "masterApiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "slaveApiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "masterHost" TEXT,
    "masterPort" INTEGER,
    "masterApiKey" TEXT,
    "syncInterval" INTEGER NOT NULL DEFAULT 60,
    "lastSyncHash" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "lastConnectedAt" DATETIME,
    "connectionError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "configHash" TEXT,
    "changesCount" INTEGER,
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "duration" INTEGER,
    CONSTRAINT "sync_logs_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "slave_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "config_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" INTEGER NOT NULL DEFAULT 1,
    "configHash" TEXT NOT NULL,
    "configData" TEXT NOT NULL,
    "createdBy" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "network_load_balancers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "port" INTEGER NOT NULL,
    "protocol" TEXT NOT NULL DEFAULT 'tcp',
    "algorithm" TEXT NOT NULL DEFAULT 'round_robin',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "proxyTimeout" INTEGER NOT NULL DEFAULT 3,
    "proxyConnectTimeout" INTEGER NOT NULL DEFAULT 1,
    "proxyNextUpstream" BOOLEAN NOT NULL DEFAULT true,
    "proxyNextUpstreamTimeout" INTEGER NOT NULL DEFAULT 0,
    "proxyNextUpstreamTries" INTEGER NOT NULL DEFAULT 0,
    "healthCheckEnabled" BOOLEAN NOT NULL DEFAULT true,
    "healthCheckInterval" INTEGER NOT NULL DEFAULT 10,
    "healthCheckTimeout" INTEGER NOT NULL DEFAULT 5,
    "healthCheckRises" INTEGER NOT NULL DEFAULT 2,
    "healthCheckFalls" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "nlb_upstreams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nlbId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "maxFails" INTEGER NOT NULL DEFAULT 3,
    "failTimeout" INTEGER NOT NULL DEFAULT 10,
    "maxConns" INTEGER NOT NULL DEFAULT 0,
    "backup" BOOLEAN NOT NULL DEFAULT false,
    "down" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'checking',
    "lastCheck" DATETIME,
    "lastError" TEXT,
    "responseTime" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "nlb_upstreams_nlbId_fkey" FOREIGN KEY ("nlbId") REFERENCES "network_load_balancers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nlb_health_checks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nlbId" TEXT NOT NULL,
    "upstreamHost" TEXT NOT NULL,
    "upstreamPort" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "responseTime" REAL,
    "error" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nlb_health_checks_nlbId_fkey" FOREIGN KEY ("nlbId") REFERENCES "network_load_balancers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_auth_userId_key" ON "two_factor_auth"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_timestamp_idx" ON "activity_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "activity_logs_type_timestamp_idx" ON "activity_logs"("type", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionId_key" ON "user_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_sessionId_idx" ON "user_sessions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "domains_name_key" ON "domains"("name");

-- CreateIndex
CREATE INDEX "domains_name_idx" ON "domains"("name");

-- CreateIndex
CREATE INDEX "domains_status_idx" ON "domains"("status");

-- CreateIndex
CREATE INDEX "upstreams_domainId_idx" ON "upstreams"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "load_balancer_configs_domainId_key" ON "load_balancer_configs"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "ssl_certificates_domainId_key" ON "ssl_certificates"("domainId");

-- CreateIndex
CREATE INDEX "ssl_certificates_domainId_idx" ON "ssl_certificates"("domainId");

-- CreateIndex
CREATE INDEX "ssl_certificates_validTo_idx" ON "ssl_certificates"("validTo");

-- CreateIndex
CREATE INDEX "modsec_crs_rules_domainId_idx" ON "modsec_crs_rules"("domainId");

-- CreateIndex
CREATE INDEX "modsec_crs_rules_category_idx" ON "modsec_crs_rules"("category");

-- CreateIndex
CREATE UNIQUE INDEX "modsec_crs_rules_ruleFile_domainId_key" ON "modsec_crs_rules"("ruleFile", "domainId");

-- CreateIndex
CREATE INDEX "modsec_rules_domainId_idx" ON "modsec_rules"("domainId");

-- CreateIndex
CREATE INDEX "modsec_rules_category_idx" ON "modsec_rules"("category");

-- CreateIndex
CREATE INDEX "nginx_configs_configType_idx" ON "nginx_configs"("configType");

-- CreateIndex
CREATE UNIQUE INDEX "installation_status_component_key" ON "installation_status"("component");

-- CreateIndex
CREATE INDEX "alert_rule_channels_ruleId_idx" ON "alert_rule_channels"("ruleId");

-- CreateIndex
CREATE INDEX "alert_rule_channels_channelId_idx" ON "alert_rule_channels"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "alert_rule_channels_ruleId_channelId_key" ON "alert_rule_channels"("ruleId", "channelId");

-- CreateIndex
CREATE INDEX "alert_history_severity_idx" ON "alert_history"("severity");

-- CreateIndex
CREATE INDEX "alert_history_acknowledged_idx" ON "alert_history"("acknowledged");

-- CreateIndex
CREATE INDEX "alert_history_timestamp_idx" ON "alert_history"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "access_lists_name_key" ON "access_lists"("name");

-- CreateIndex
CREATE INDEX "access_lists_type_idx" ON "access_lists"("type");

-- CreateIndex
CREATE INDEX "access_lists_enabled_idx" ON "access_lists"("enabled");

-- CreateIndex
CREATE INDEX "access_list_auth_users_accessListId_idx" ON "access_list_auth_users"("accessListId");

-- CreateIndex
CREATE UNIQUE INDEX "access_list_auth_users_accessListId_username_key" ON "access_list_auth_users"("accessListId", "username");

-- CreateIndex
CREATE INDEX "access_list_domains_accessListId_idx" ON "access_list_domains"("accessListId");

-- CreateIndex
CREATE INDEX "access_list_domains_domainId_idx" ON "access_list_domains"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "access_list_domains_accessListId_domainId_key" ON "access_list_domains"("accessListId", "domainId");

-- CreateIndex
CREATE INDEX "performance_metrics_domain_timestamp_idx" ON "performance_metrics"("domain", "timestamp");

-- CreateIndex
CREATE INDEX "performance_metrics_timestamp_idx" ON "performance_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "backup_files_scheduleId_idx" ON "backup_files"("scheduleId");

-- CreateIndex
CREATE INDEX "backup_files_createdAt_idx" ON "backup_files"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "slave_nodes_name_key" ON "slave_nodes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "slave_nodes_apiKey_key" ON "slave_nodes"("apiKey");

-- CreateIndex
CREATE INDEX "slave_nodes_status_idx" ON "slave_nodes"("status");

-- CreateIndex
CREATE INDEX "slave_nodes_lastSeen_idx" ON "slave_nodes"("lastSeen");

-- CreateIndex
CREATE INDEX "sync_logs_nodeId_startedAt_idx" ON "sync_logs"("nodeId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "config_versions_configHash_key" ON "config_versions"("configHash");

-- CreateIndex
CREATE INDEX "config_versions_createdAt_idx" ON "config_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "network_load_balancers_name_key" ON "network_load_balancers"("name");

-- CreateIndex
CREATE INDEX "network_load_balancers_status_idx" ON "network_load_balancers"("status");

-- CreateIndex
CREATE INDEX "network_load_balancers_port_idx" ON "network_load_balancers"("port");

-- CreateIndex
CREATE INDEX "nlb_upstreams_nlbId_idx" ON "nlb_upstreams"("nlbId");

-- CreateIndex
CREATE INDEX "nlb_upstreams_status_idx" ON "nlb_upstreams"("status");

-- CreateIndex
CREATE INDEX "nlb_health_checks_nlbId_checkedAt_idx" ON "nlb_health_checks"("nlbId", "checkedAt");

-- CreateIndex
CREATE INDEX "nlb_health_checks_upstreamHost_upstreamPort_idx" ON "nlb_health_checks"("upstreamHost", "upstreamPort");
