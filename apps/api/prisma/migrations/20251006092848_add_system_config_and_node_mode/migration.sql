-- CreateEnum
CREATE TYPE "NodeMode" AS ENUM ('master', 'slave');

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "nodeMode" "NodeMode" NOT NULL DEFAULT 'master',
    "masterApiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "slaveApiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "masterHost" TEXT,
    "masterPort" INTEGER,
    "masterApiKey" TEXT,
    "syncInterval" INTEGER NOT NULL DEFAULT 60,
    "lastSyncHash" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "lastConnectedAt" TIMESTAMP(3),
    "connectionError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);
