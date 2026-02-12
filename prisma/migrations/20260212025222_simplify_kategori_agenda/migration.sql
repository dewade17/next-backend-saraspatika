/*
  Warnings:

  - Added the required column `kategori_agenda` to the `agenda` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KategoriAgenda" AS ENUM ('KERJA', 'MENGAJAR');

-- AlterTable
ALTER TABLE "agenda" ADD COLUMN     "kategori_agenda" "KategoriAgenda" NOT NULL;
