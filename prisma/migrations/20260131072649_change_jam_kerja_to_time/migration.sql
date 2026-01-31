/*
  Warnings:

  - Changed the type of `jam_mulai_kerja` on the `pola_jam_kerja` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `jam_selesai_kerja` on the `pola_jam_kerja` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "pola_jam_kerja" DROP COLUMN "jam_mulai_kerja",
ADD COLUMN     "jam_mulai_kerja" TIME NOT NULL,
DROP COLUMN "jam_selesai_kerja",
ADD COLUMN     "jam_selesai_kerja" TIME NOT NULL;
