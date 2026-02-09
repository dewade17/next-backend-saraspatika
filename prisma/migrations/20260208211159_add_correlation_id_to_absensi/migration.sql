/*
  Warnings:

  - A unique constraint covering the columns `[correlation_id]` on the table `absensi` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "absensi" ADD COLUMN     "correlation_id" CHAR(36);

-- CreateIndex
CREATE UNIQUE INDEX "absensi_correlation_id_key" ON "absensi"("correlation_id");

-- CreateIndex
CREATE INDEX "absensi_correlation_id_idx" ON "absensi"("correlation_id");
