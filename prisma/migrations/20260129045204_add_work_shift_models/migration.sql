-- CreateTable
CREATE TABLE "pola_jam_kerja" (
    "id_pola_kerja" TEXT NOT NULL,
    "nama_pola_kerja" TEXT NOT NULL,
    "jam_mulai_kerja" TEXT NOT NULL,
    "jam_selesai_kerja" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pola_jam_kerja_pkey" PRIMARY KEY ("id_pola_kerja")
);

-- CreateTable
CREATE TABLE "jadwal_shift_kerja" (
    "id_jadwal_shift" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "id_pola_kerja" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jadwal_shift_kerja_pkey" PRIMARY KEY ("id_jadwal_shift")
);

-- CreateIndex
CREATE UNIQUE INDEX "pola_jam_kerja_nama_pola_kerja_key" ON "pola_jam_kerja"("nama_pola_kerja");

-- CreateIndex
CREATE INDEX "jadwal_shift_kerja_tanggal_idx" ON "jadwal_shift_kerja"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_shift_kerja_id_user_tanggal_key" ON "jadwal_shift_kerja"("id_user", "tanggal");

-- AddForeignKey
ALTER TABLE "jadwal_shift_kerja" ADD CONSTRAINT "jadwal_shift_kerja_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_shift_kerja" ADD CONSTRAINT "jadwal_shift_kerja_id_pola_kerja_fkey" FOREIGN KEY ("id_pola_kerja") REFERENCES "pola_jam_kerja"("id_pola_kerja") ON DELETE CASCADE ON UPDATE CASCADE;
