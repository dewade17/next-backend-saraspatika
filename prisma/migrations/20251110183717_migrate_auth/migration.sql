-- CreateTable
CREATE TABLE "users" (
    "id_user" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id_password_reset_token" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id_password_reset_token")
);

-- CreateTable
CREATE TABLE "roles" (
    "id_role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_role")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id_permission" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id_permission")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id_user" TEXT NOT NULL,
    "id_role" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id_user","id_role")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id_role" TEXT NOT NULL,
    "id_permission" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id_role","id_permission")
);

-- CreateTable
CREATE TABLE "user_permission_overrides" (
    "id_user" TEXT NOT NULL,
    "id_permission" TEXT NOT NULL,
    "grant" BOOLEAN NOT NULL,

    CONSTRAINT "user_permission_overrides_pkey" PRIMARY KEY ("id_user","id_permission")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "password_reset_tokens_id_user_idx" ON "password_reset_tokens"("id_user");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "user_roles_id_role_idx" ON "user_roles"("id_role");

-- CreateIndex
CREATE INDEX "role_permissions_id_permission_idx" ON "role_permissions"("id_permission");

-- CreateIndex
CREATE INDEX "user_permission_overrides_id_permission_idx" ON "user_permission_overrides"("id_permission");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "roles"("id_role") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "roles"("id_role") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_id_permission_fkey" FOREIGN KEY ("id_permission") REFERENCES "permissions"("id_permission") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_id_permission_fkey" FOREIGN KEY ("id_permission") REFERENCES "permissions"("id_permission") ON DELETE CASCADE ON UPDATE CASCADE;
