/*
  Warnings:

  - A unique constraint covering the columns `[plan,provider,effectiveAt]` on the table `CommercialOffer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "PlanCapability" (
    "id" TEXT NOT NULL,
    "plan" "AccessPlan" NOT NULL,
    "capability" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "limit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCheckout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerCheckoutId" TEXT,
    "url" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanCapability_plan_idx" ON "PlanCapability"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "PlanCapability_plan_capability_key" ON "PlanCapability"("plan", "capability");

-- CreateIndex
CREATE INDEX "BillingCheckout_expiresAt_idx" ON "BillingCheckout"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCheckout_userId_provider_key" ON "BillingCheckout"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCheckout_provider_providerCheckoutId_key" ON "BillingCheckout"("provider", "providerCheckoutId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialOffer_plan_provider_effectiveAt_key" ON "CommercialOffer"("plan", "provider", "effectiveAt");

-- AddForeignKey
ALTER TABLE "BillingCheckout" ADD CONSTRAINT "BillingCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
