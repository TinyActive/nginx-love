-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'system';

-- AlterTable
ALTER TABLE "activity_logs" ALTER COLUMN "userId" DROP NOT NULL;
