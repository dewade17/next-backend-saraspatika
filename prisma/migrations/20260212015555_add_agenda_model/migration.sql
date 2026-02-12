-- CreateTable
CREATE TABLE "agenda" (
    "id_agenda" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "jam_mulai" TIME NOT NULL,
    "jam_selesai" TIME NOT NULL,
    "bukti_pendukung_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_pkey" PRIMARY KEY ("id_agenda")
);

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
