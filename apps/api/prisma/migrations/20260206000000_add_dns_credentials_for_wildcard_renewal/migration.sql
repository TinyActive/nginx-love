-- AlterTable
ALTER TABLE "ssl_certificates" ADD COLUMN "dnsProvider" TEXT;
ALTER TABLE "ssl_certificates" ADD COLUMN "dnsCredentials" JSONB;
