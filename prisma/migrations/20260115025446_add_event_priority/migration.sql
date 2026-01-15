-- CreateEnum
CREATE TYPE "EventPriority" AS ENUM ('REQUIRED', 'IMPORTANT', 'OPTIONAL');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "priority" "EventPriority" NOT NULL DEFAULT 'IMPORTANT';

-- CreateIndex
CREATE INDEX "Event_priority_idx" ON "Event"("priority");
