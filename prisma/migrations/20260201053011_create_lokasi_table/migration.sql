-- CreateTable
CREATE TABLE "lokasi" (
    "id_lokasi" TEXT NOT NULL,
    "nama_lokasi" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lokasi_pkey" PRIMARY KEY ("id_lokasi")
);

-- CreateIndex
CREATE UNIQUE INDEX "lokasi_nama_lokasi_key" ON "lokasi"("nama_lokasi");
