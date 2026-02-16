-- CreateTable
CREATE TABLE "profile_sekolah" (
    "id_profile" TEXT NOT NULL,
    "nama_sekolah" TEXT NOT NULL,
    "no_telepon" TEXT,
    "alamat_sekolah" TEXT NOT NULL,
    "npsn" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_sekolah_pkey" PRIMARY KEY ("id_profile")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_sekolah_npsn_key" ON "profile_sekolah"("npsn");
