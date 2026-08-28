-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('PUBLIC', 'INTERNAL', 'ARCHIVED', 'DELETED');

-- DropIndex
DROP INDEX "Protocol_visibility_idx";

-- AlterTable
ALTER TABLE "Protocol" DROP COLUMN "visibility",
ADD COLUMN     "status" "ProtocolStatus" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Protocol_status_idx" ON "Protocol"("status");

