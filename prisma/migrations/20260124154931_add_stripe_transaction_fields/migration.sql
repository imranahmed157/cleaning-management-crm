-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionStatus" ADD VALUE 'APPROVED';
ALTER TYPE "TransactionStatus" ADD VALUE 'PAID';
ALTER TYPE "TransactionStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "net_amount" DOUBLE PRECISION,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "stripe_charge_id" TEXT,
ADD COLUMN     "stripe_fee" DOUBLE PRECISION;
