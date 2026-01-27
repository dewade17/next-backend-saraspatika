/*
  Warnings:

  - A unique constraint covering the columns `[nip]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "foto_profil_url" TEXT,
ADD COLUMN     "nip" TEXT,
ADD COLUMN     "nomor_handphone" TEXT,
ADD COLUMN     "status" TEXT,
ALTER COLUMN "role" SET DEFAULT 'GURU';

-- CreateIndex
CREATE UNIQUE INDEX "users_nip_key" ON "users"("nip");
