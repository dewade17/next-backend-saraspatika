import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const RES = ['absensi', 'izin', 'pegawai'];
const ACT = ['create', 'read', 'update', 'delete'];

// Matrix role -> resource -> aksi
const ROLES = {
  GURU: {
    absensi: ['read'],
    izin: ['create', 'read', 'update'],
    pegawai: [],
  },
  PEGAWAI: {
    absensi: ['read', 'update'],
    izin: ['create', 'read', 'update'],
    pegawai: ['read'],
  },
  KEPALA_SEKOLAH: {
    absensi: ['create', 'read', 'update', 'delete'],
    izin: ['create', 'read', 'update', 'delete'],
    pegawai: ['read', 'update'],
  },
};

function k(resource, action) {
  return `${resource}:${action}`;
}

async function upsertPermission(resource, action) {
  return prisma.permission.upsert({
    where: { resource_action: { resource, action } },
    update: {},
    create: { resource, action },
  });
}

async function main() {
  // Pastikan seluruh kombinasi CRUD tersedia untuk tiap resource
  const permMap = {};
  for (const r of RES) {
    for (const a of ACT) {
      const p = await upsertPermission(r, a);
      permMap[k(r, a)] = p;
    }
  }

  // Buat role dan grants sesuai matrix
  for (const [roleName, matrix] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    for (const [res, actions] of Object.entries(matrix)) {
      for (const a of actions) {
        const perm = permMap[k(res, a)] || (await upsertPermission(res, a));
        await prisma.rolePermission.upsert({
          where: { id_role_id_permission: { id_role: role.id_role, id_permission: perm.id_permission } },
          update: {},
          create: { id_role: role.id_role, id_permission: perm.id_permission },
        });
      }
    }
  }

  // contoh user kepala sekolah (ganti hash asli)
  const kepala = await prisma.user.upsert({
    where: { email: 'kepsek@example.com' },
    update: {},
    create: {
      email: 'kepsek@example.com',
      name: 'Kepala Sekolah',
      password_hash: '$2a$12$PLACE_REAL_BCRYPT_HASH',
    },
  });

  const kepsekRole = await prisma.role.findUnique({ where: { name: 'KEPALA_SEKOLAH' } });
  await prisma.userRole.upsert({
    where: { id_user_id_role: { id_user: kepala.id_user, id_role: kepsekRole.id_role } },
    update: {},
    create: { id_user: kepala.id_user, id_role: kepsekRole.id_role },
  });

  console.log('Seed RBAC (GURU/PEGAWAI/KEPALA_SEKOLAH) ✅');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
