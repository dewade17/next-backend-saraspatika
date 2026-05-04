-- AlterTable
ALTER TABLE "users" ADD COLUMN     "session_version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_devices" (
    "id_device" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "device_id_hash" TEXT NOT NULL,
    "device_name" TEXT,
    "device_platform" TEXT,
    "last_ip" TEXT,
    "last_user_agent" TEXT,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id_device")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_id_user_key" ON "user_devices"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_device_id_hash_key" ON "user_devices"("device_id_hash");

-- CreateIndex
CREATE INDEX "user_devices_last_login_at_idx" ON "user_devices"("last_login_at");

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
