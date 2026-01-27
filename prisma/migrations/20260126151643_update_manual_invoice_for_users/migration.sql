-- DropForeignKey
ALTER TABLE "ManualInvoice" DROP CONSTRAINT "ManualInvoice_clientId_fkey";

-- AlterTable
ALTER TABLE "ManualInvoice" ADD COLUMN     "cleanerUserId" TEXT,
ADD COLUMN     "recipientType" TEXT NOT NULL DEFAULT 'CLIENT',
ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ManualInvoice" ADD CONSTRAINT "ManualInvoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualInvoice" ADD CONSTRAINT "ManualInvoice_cleanerUserId_fkey" FOREIGN KEY ("cleanerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
