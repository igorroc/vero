-- CreateTable
CREATE TABLE "SuperAdminRole" (
    "userId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedByUserId" TEXT,

    CONSTRAINT "SuperAdminRole_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "SuperAdminRole_grantedByUserId_idx" ON "SuperAdminRole"("grantedByUserId");

-- AddForeignKey
ALTER TABLE "SuperAdminRole" ADD CONSTRAINT "SuperAdminRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuperAdminRole" ADD CONSTRAINT "SuperAdminRole_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
