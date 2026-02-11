-- AlterTable: Add wildcard SSL certificate support fields
ALTER TABLE "ssl_certificates"
ADD COLUMN "isWildcard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "wildcardDomain" TEXT;

-- CreateIndex: Index on isWildcard for efficient wildcard certificate queries
CREATE INDEX "ssl_certificates_isWildcard_idx" ON "ssl_certificates"("isWildcard");
