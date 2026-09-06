-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'TRANSFER';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "destinationAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Event_destinationAccountId_idx" ON "Event"("destinationAccountId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
