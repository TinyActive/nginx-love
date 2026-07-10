-- CreateEnum
CREATE TYPE "Ja4FingerprintType" AS ENUM ('ja4', 'ja4h', 'ja4s', 'ja4tcp', 'ja4one');

-- CreateEnum
CREATE TYPE "BotPolicyMode" AS ENUM ('blacklist', 'whitelist');

-- CreateEnum
CREATE TYPE "BotRuleAction" AS ENUM ('allow', 'deny', 'log_only');

-- AlterTable
ALTER TABLE "domains" ADD COLUMN "botManagerEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "bot_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "policyMode" "BotPolicyMode" NOT NULL DEFAULT 'blacklist',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_rules" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "name" TEXT NOT NULL,
    "fingerprintType" "Ja4FingerprintType" NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "action" "BotRuleAction" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "notes" TEXT,
    "clientLabel" TEXT,
    "isBuiltin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_profile_domains" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_profile_domains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_profiles_name_key" ON "bot_profiles"("name");

-- CreateIndex
CREATE INDEX "bot_rules_profileId_enabled_priority_idx" ON "bot_rules"("profileId", "enabled", "priority");

-- CreateIndex
CREATE INDEX "bot_rules_isBuiltin_idx" ON "bot_rules"("isBuiltin");

-- CreateIndex
CREATE UNIQUE INDEX "bot_profile_domains_profileId_domainId_key" ON "bot_profile_domains"("profileId", "domainId");

-- CreateIndex
CREATE INDEX "bot_profile_domains_domainId_idx" ON "bot_profile_domains"("domainId");

-- AddForeignKey
ALTER TABLE "bot_rules" ADD CONSTRAINT "bot_rules_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "bot_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_profile_domains" ADD CONSTRAINT "bot_profile_domains_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "bot_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_profile_domains" ADD CONSTRAINT "bot_profile_domains_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
