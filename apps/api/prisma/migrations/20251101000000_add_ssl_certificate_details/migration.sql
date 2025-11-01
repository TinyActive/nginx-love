-- AlterTable: Add new fields to ssl_certificates table for detailed certificate information
ALTER TABLE "ssl_certificates" 
ADD COLUMN "subject" TEXT,
ADD COLUMN "subjectDetails" JSONB,
ADD COLUMN "issuerDetails" JSONB,
ADD COLUMN "serialNumber" TEXT;

-- Add comments to explain the new fields
COMMENT ON COLUMN "ssl_certificates"."subject" IS 'Full subject string from certificate (e.g., CN=example.com, O=Example, C=US)';
COMMENT ON COLUMN "ssl_certificates"."subjectDetails" IS 'Parsed subject details as JSON: {commonName, organization, country}';
COMMENT ON COLUMN "ssl_certificates"."issuerDetails" IS 'Parsed issuer details as JSON: {commonName, organization, country}';
COMMENT ON COLUMN "ssl_certificates"."serialNumber" IS 'Certificate serial number';
