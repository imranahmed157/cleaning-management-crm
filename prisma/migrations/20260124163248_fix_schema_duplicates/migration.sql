/*
  Warnings:

  - The values [COMPLETED] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `guest_stripe_id` on the `transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_payment_intent_id]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[task_id]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('PENDING', 'CHARGED', 'APPROVED', 'PAID', 'FAILED', 'REFUNDED');
ALTER TABLE "transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "TransactionStatus_old";
ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_cleaner_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_task_id_fkey";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "guest_stripe_id",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cleaner_payout" DOUBLE PRECISION,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "platform_fee" DOUBLE PRECISION,
ADD COLUMN     "platform_fee_type" TEXT DEFAULT 'AUTO_20_PERCENT',
ALTER COLUMN "task_id" DROP NOT NULL,
ALTER COLUMN "cleaner_id" DROP NOT NULL,
ALTER COLUMN "cleaner_fee" DROP NOT NULL,
ALTER COLUMN "guest_charge" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_stripe_payment_intent_id_key" ON "transactions"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_task_id_key" ON "transactions"("task_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cleaner_id_fkey" FOREIGN KEY ("cleaner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
