-- CreateTable
CREATE TABLE "CommercialOffer" (
    "id" TEXT NOT NULL,
    "plan" "AccessPlan" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "provider" TEXT NOT NULL,
    "providerProductId" TEXT NOT NULL,
    "providerPriceId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "CommercialOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommercialOffer_plan_provider_isActive_effectiveAt_idx" ON "CommercialOffer"("plan", "provider", "isActive", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialOffer_provider_providerPriceId_key" ON "CommercialOffer"("provider", "providerPriceId");

-- AddForeignKey
ALTER TABLE "CommercialOffer" ADD CONSTRAINT "CommercialOffer_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
