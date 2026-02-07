-- AlterTable
ALTER TABLE "absensi" ALTER COLUMN "status_masuk" DROP NOT NULL,
ALTER COLUMN "status_masuk" DROP DEFAULT,
ALTER COLUMN "status_pulang" DROP NOT NULL,
ALTER COLUMN "status_pulang" DROP DEFAULT;
