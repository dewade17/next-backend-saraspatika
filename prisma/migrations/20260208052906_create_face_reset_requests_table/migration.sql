-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('MENUNGGU', 'SETUJU', 'DITOLAK');

-- CreateTable
CREATE TABLE "face_reset_requests" (
    "id_request" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'MENUNGGU',
    "admin_note" TEXT,
    "id_admin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "face_reset_requests_pkey" PRIMARY KEY ("id_request")
);

-- AddForeignKey
ALTER TABLE "face_reset_requests" ADD CONSTRAINT "face_reset_requests_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_reset_requests" ADD CONSTRAINT "face_reset_requests_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;
