-- CreateTable
CREATE TABLE "absensi_wfh" (
    "id_absensi_wfh" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "correlation_id" CHAR(36),
    "waktu_masuk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktu_pulang" TIMESTAMP(3),
    "face_verified_masuk" BOOLEAN NOT NULL DEFAULT false,
    "face_verified_pulang" BOOLEAN NOT NULL DEFAULT false,
    "status_masuk" "StatusAbsensi",
    "status_pulang" "StatusAbsensi",
    "in_latitude" DECIMAL(10,6),
    "in_longitude" DECIMAL(10,6),
    "out_latitude" DECIMAL(10,6),
    "out_longitude" DECIMAL(10,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absensi_wfh_pkey" PRIMARY KEY ("id_absensi_wfh")
);

-- CreateIndex
CREATE UNIQUE INDEX "absensi_wfh_correlation_id_key" ON "absensi_wfh"("correlation_id");

-- CreateIndex
CREATE INDEX "absensi_wfh_id_user_idx" ON "absensi_wfh"("id_user");

-- CreateIndex
CREATE INDEX "absensi_wfh_waktu_masuk_idx" ON "absensi_wfh"("waktu_masuk");

-- CreateIndex
CREATE INDEX "absensi_wfh_correlation_id_idx" ON "absensi_wfh"("correlation_id");

-- AddForeignKey
ALTER TABLE "absensi_wfh" ADD CONSTRAINT "absensi_wfh_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
