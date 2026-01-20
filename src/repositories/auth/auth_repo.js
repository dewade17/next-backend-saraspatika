import { prisma } from '@/lib/db.js';

export async function findUserByEmail(email) {
  return await prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id_user) {
  return await prisma.user.findUnique({ where: { id_user } });
}

export async function createUserWithRole({ email, name, password_hash, role_name }) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: name ?? null,
        password_hash,
        role: role_name, // convenience field; RBAC truth is user_roles
      },
    });

    const role = await tx.role.upsert({
      where: { name: role_name },
      update: {},
      create: { name: role_name },
    });

    await tx.userRole.create({
      data: { id_user: user.id_user, id_role: role.id_role },
    });

    return { user, role };
  });
}

export async function createPasswordResetToken({ id_user, code_hash, expires_at }) {
  return await prisma.passwordResetToken.create({
    data: { id_user, code_hash, expires_at },
  });
}

export async function findLatestValidResetToken(id_user, now = new Date()) {
  return await prisma.passwordResetToken.findFirst({
    where: {
      id_user,
      consumed_at: null,
      expires_at: { gt: now },
    },
    orderBy: { expires_at: 'desc' },
  });
}

export async function consumeResetTokenAndUpdatePassword({ id_user, id_password_reset_token, password_hash }) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id_user },
      data: { password_hash },
    });

    const token = await tx.passwordResetToken.update({
      where: { id_password_reset_token },
      data: { consumed_at: new Date() },
    });

    return { user, token };
  });
}
