-- CreateEnum
CREATE TYPE "StatusAbsensi" AS ENUM ('TEPAT', 'TERLAMBAT');

-- CreateTable
CREATE TABLE "user_face" (
    "id_biometrik" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "embedding_path" TEXT NOT NULL,
    "foto_referensi" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_face_pkey" PRIMARY KEY ("id_biometrik")
);

-- CreateTable
CREATE TABLE "absensi" (
    "id_absensi" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "id_jadwal_shift" TEXT,
    "id_lokasi_datang" CHAR(36),
    "id_lokasi_pulang" CHAR(36),
    "waktu_masuk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktu_pulang" TIMESTAMP(3),
    "face_verified_masuk" BOOLEAN NOT NULL DEFAULT false,
    "face_verified_pulang" BOOLEAN NOT NULL DEFAULT false,
    "foto_absensi_masuk" TEXT,
    "foto_absensi_pulang" TEXT,
    "status_masuk" "StatusAbsensi" NOT NULL DEFAULT 'TEPAT',
    "status_pulang" "StatusAbsensi" NOT NULL DEFAULT 'TEPAT',
    "in_latitude" DECIMAL(10,6),
    "in_longitude" DECIMAL(10,6),
    "out_latitude" DECIMAL(10,6),
    "out_longitude" DECIMAL(10,6),

    CONSTRAINT "absensi_pkey" PRIMARY KEY ("id_absensi")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_face_id_user_key" ON "user_face"("id_user");

-- CreateIndex
CREATE INDEX "absensi_id_user_idx" ON "absensi"("id_user");

-- CreateIndex
CREATE INDEX "absensi_waktu_masuk_idx" ON "absensi"("waktu_masuk");

-- AddForeignKey
ALTER TABLE "user_face" ADD CONSTRAINT "user_face_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_id_jadwal_shift_fkey" FOREIGN KEY ("id_jadwal_shift") REFERENCES "jadwal_shift_kerja"("id_jadwal_shift") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_id_lokasi_datang_fkey" FOREIGN KEY ("id_lokasi_datang") REFERENCES "lokasi"("id_lokasi") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absensi" ADD CONSTRAINT "absensi_id_lokasi_pulang_fkey" FOREIGN KEY ("id_lokasi_pulang") REFERENCES "lokasi"("id_lokasi") ON DELETE SET NULL ON UPDATE CASCADE;
