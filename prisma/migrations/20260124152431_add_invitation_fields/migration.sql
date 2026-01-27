/*
  Warnings:

  - A unique constraint covering the columns `[invite_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "invite_token" TEXT,
ADD COLUMN     "invite_token_expiry" TIMESTAMP(3),
ADD COLUMN     "invited_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_invite_token_key" ON "users"("invite_token");
