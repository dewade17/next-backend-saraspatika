/*
  Warnings:

  - You are about to drop the column `foto_absensi_masuk` on the `absensi` table. All the data in the column will be lost.
  - You are about to drop the column `foto_absensi_pulang` on the `absensi` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "absensi" DROP COLUMN "foto_absensi_masuk",
DROP COLUMN "foto_absensi_pulang";
