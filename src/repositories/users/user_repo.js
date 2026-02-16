import { prisma } from '@/lib/db.js';

const publicSelect = {
  id_user: true,
  email: true,
  name: true,
  status: true,
  nomor_handphone: true,
  nip: true,
  foto_profil_url: true,
  role: true,
  created_at: true,
  updated_at: true,
};

function buildSearchWhere(q) {
  const s = String(q || '').trim();
  if (!s) return undefined;

  return {
    OR: [
      { email: { contains: s, mode: 'insensitive' } },
      { name: { contains: s, mode: 'insensitive' } },
      { nip: { contains: s, mode: 'insensitive' } },
      { nomor_handphone: { contains: s, mode: 'insensitive' } },
      { role: { contains: s, mode: 'insensitive' } },
      { status: { contains: s, mode: 'insensitive' } },
    ],
  };
}

export async function listUsers({ q } = {}) {
  return await prisma.user.findMany({
    where: buildSearchWhere(q),
    select: publicSelect,
    orderBy: { created_at: 'desc' },
  });
}

export async function getUserById(id_user) {
  return await prisma.user.findUnique({
    where: { id_user },
    select: publicSelect,
  });
}

export async function findById(id_user) {
  return await getUserById(id_user);
}

export async function createUserWithRole({ email, name, password_hash, status, nomor_handphone, nip, foto_profil_url, role_name }) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: name ?? null,
        password_hash,
        status: status ?? null,
        nomor_handphone: nomor_handphone ?? null,
        nip: nip ?? null,
        foto_profil_url: foto_profil_url ?? null,
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

    return await tx.user.findUnique({
      where: { id_user: user.id_user },
      select: publicSelect,
    });
  });
}

export async function updateUserWithRole(id_user, data) {
  return await prisma.$transaction(async (tx) => {
    const { role_name, ...userData } = data;

    await tx.user.update({
      where: { id_user },
      data: {
        ...(userData.email != null ? { email: userData.email } : {}),
        ...(userData.name != null ? { name: userData.name } : {}),
        ...(userData.status != null ? { status: userData.status } : {}),
        ...(userData.nomor_handphone != null ? { nomor_handphone: userData.nomor_handphone } : {}),
        ...(userData.nip != null ? { nip: userData.nip } : {}),
        ...(userData.foto_profil_url != null ? { foto_profil_url: userData.foto_profil_url } : {}),
        ...(userData.password_hash != null ? { password_hash: userData.password_hash } : {}),
        ...(role_name != null ? { role: role_name } : {}),
      },
    });

    if (role_name != null) {
      const role = await tx.role.upsert({
        where: { name: role_name },
        update: {},
        create: { name: role_name },
      });

      await tx.userRole.deleteMany({ where: { id_user } });
      await tx.userRole.create({
        data: { id_user, id_role: role.id_role },
      });
    }

    return await tx.user.findUnique({
      where: { id_user },
      select: publicSelect,
    });
  });
}

export async function deleteUser(id_user) {
  return await prisma.user.delete({
    where: { id_user },
    select: publicSelect,
  });
}
