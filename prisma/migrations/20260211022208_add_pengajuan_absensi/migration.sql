-- CreateEnum
CREATE TYPE "JenisPengajuan" AS ENUM ('IZIN', 'SAKIT', 'CUTI');

-- CreateTable
CREATE TABLE "pengajuan_absensi" (
    "id_pengajuan" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "jenis_pengajuan" "JenisPengajuan" NOT NULL,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3) NOT NULL,
    "alasan" TEXT NOT NULL,
    "foto_bukti_url" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'MENUNGGU',
    "admin_note" TEXT,
    "id_admin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengajuan_absensi_pkey" PRIMARY KEY ("id_pengajuan")
);

-- AddForeignKey
ALTER TABLE "pengajuan_absensi" ADD CONSTRAINT "pengajuan_absensi_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_absensi" ADD CONSTRAINT "pengajuan_absensi_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;
