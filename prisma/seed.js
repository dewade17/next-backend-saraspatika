const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Pastikan variabel lingkungan dimuat

// Ambil URL database dari .env
const connectionString = process.env.DATABASE_URL;

// Inisialisasi pool dan adapter untuk Prisma 7
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Inisialisasi Prisma Client dengan adapter (WAJIB di Prisma 7)
const prisma = new PrismaClient({ adapter });

function norm(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase();
}

function key(resource, action) {
  return `${norm(resource)}:${norm(action)}`;
}

async function upsertPermission(resource, action) {
  const r = norm(resource);
  const a = norm(action);
  return prisma.permission.upsert({
    where: { resource_action: { resource: r, action: a } },
    update: {},
    create: { resource: r, action: a },
  });
}

async function upsertRole(name, description) {
  return prisma.role.upsert({
    where: { name },
    update: { description: description ?? undefined },
    create: { name, description: description ?? null },
  });
}

/**
 * Build role->Set(permissionKey)
 */
function buildRoleMatrix() {
  const CRUD = ['create', 'read', 'update', 'delete'];

  const matrix = {
    ADMIN: new Set(),
    KEPALA_SEKOLAH: new Set(),
    GURU: new Set(),
    PEGAWAI: new Set(),
  };

  const grant = (roles, resource, actions) => {
    const acts = Array.isArray(actions) ? actions : [actions];
    for (const roleName of roles) {
      const set = matrix[roleName];
      if (!set) continue;
      for (const a of acts) set.add(key(resource, a));
    }
  };

  // ===== Auth (SKPL.F-001, F-002, F-003) =====
  grant(['ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'PEGAWAI'], 'auth', ['login', 'logout']);
  grant(['ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'PEGAWAI'], 'auth', ['request_token', 'reset_password']);

  // ===== Profile (SKPL.F-004) =====
  grant(['KEPALA_SEKOLAH', 'GURU', 'PEGAWAI'], 'profile', ['read', 'update']);

  // ===== Wajah/Face (SKPL.F-005, F-014) =====
  grant(['KEPALA_SEKOLAH', 'GURU', 'PEGAWAI'], 'wajah', ['read', 'update']); // kelola wajah
  grant(['ADMIN', 'KEPALA_SEKOLAH'], 'wajah', ['reset']); // reset wajah pengguna

  // ===== Absensi (SKPL.F-006, F-011) =====
  // semua user melakukan absensi (create/update/read)
  grant(['KEPALA_SEKOLAH', 'GURU', 'PEGAWAI'], 'absensi', ['create', 'read', 'update']);
  // manajemen absensi (admin + kepala sekolah) full CRUD
  grant(['ADMIN', 'KEPALA_SEKOLAH'], 'absensi', CRUD);

  // ===== Agenda (SKPL.F-007, F-010 monitoring) =====
  grant(['KEPALA_SEKOLAH', 'GURU', 'PEGAWAI'], 'agenda', CRUD);
  grant(['ADMIN', 'KEPALA_SEKOLAH'], 'agenda', ['monitor']); // monitoring agenda kerja & mengajar

  // ===== Izin/Sakit/Cuti (SKPL.F-009, F-010 verifikasi) =====
  // pengajuan oleh kepala sekolah/guru/pegawai
  grant(['KEPALA_SEKOLAH', 'GURU', 'PEGAWAI'], 'izin', ['create', 'read', 'update']);
  // admin+kepsek dapat kelola penuh & verifikasi
  grant(['ADMIN', 'KEPALA_SEKOLAH'], 'izin', CRUD);
  grant(['ADMIN', 'KEPALA_SEKOLAH'], 'izin', ['verify']);

  // ===== Lokasi (SKPL.F-012) =====
  grant(['ADMIN', 'KEPALA_SEKOLAH'], 'lokasi', CRUD);

  // ===== Pengguna/Pegawai (SKPL.F-013) =====
  // Di project kamu menu admin masih pakai resource "pegawai", jadi kita seed itu juga.
  grant(['ADMIN', 'KEPALA_SEKOLAH'], 'pegawai', CRUD);
  // Optional: alias "pengguna" kalau nanti kamu pakai resource baru
  grant(['ADMIN', 'KEPALA_SEKOLAH'], 'pengguna', CRUD);

  // ===== Pola Jam Kerja (BARU) =====
  // Admin + Kepala Sekolah bisa kelola pola jam kerja (CRUD)
  grant(['ADMIN', 'KEPALA_SEKOLAH'], 'pola_jam_kerja', CRUD);
  grant(['GURU'], 'pola_jam_kerja', 'read');

  // ===== Admin superuser =====
  // Pastikan ADMIN punya semua permission yang ada di matrix ini (sudah, tapi kita double-ensure)
  for (const [roleName, set] of Object.entries(matrix)) {
    if (roleName === 'ADMIN') continue;
    for (const p of set) matrix.ADMIN.add(p);
  }

  return matrix;
}

async function syncRolePermissions(role, desiredPermissionIds) {
  // Hapus grant yang tidak ada di desired
  await prisma.rolePermission.deleteMany({
    where: {
      id_role: role.id_role,
      NOT: { id_permission: { in: desiredPermissionIds } },
    },
  });

  // Upsert desired
  for (const id_permission of desiredPermissionIds) {
    await prisma.rolePermission.upsert({
      where: {
        id_role_id_permission: {
          id_role: role.id_role,
          id_permission,
        },
      },
      update: {},
      create: { id_role: role.id_role, id_permission },
    });
  }
}

async function upsertUserWithRole({ email, name, roleName, passwordHash }) {
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: name ?? undefined },
    create: {
      email,
      name,
      password_hash: passwordHash,
      role: roleName, // opsional (bukan source of truth), tapi membantu
    },
  });

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`Role "${roleName}" tidak ditemukan`);

  // Pastikan user hanya punya role ini (kalau kamu ingin multi-role, hapus block ini)
  await prisma.userRole.deleteMany({
    where: {
      id_user: user.id_user,
      NOT: { id_role: role.id_role },
    },
  });

  await prisma.userRole.upsert({
    where: { id_user_id_role: { id_user: user.id_user, id_role: role.id_role } },
    update: {},
    create: { id_user: user.id_user, id_role: role.id_role },
  });

  return user;
}

async function main() {
  const roleMatrix = buildRoleMatrix();

  // 1) Pastikan roles ada
  await upsertRole('ADMIN', 'Administrator sistem');
  await upsertRole('KEPALA_SEKOLAH', 'Kepala sekolah');
  await upsertRole('GURU', 'Guru');
  await upsertRole('PEGAWAI', 'Pegawai');

  // 2) Pastikan semua permission ada + map key -> permission
  const allPermKeys = new Set();
  for (const set of Object.values(roleMatrix)) {
    for (const p of set) allPermKeys.add(p);
  }

  const permMap = new Map(); // key -> Permission record
  for (const p of allPermKeys) {
    const [resource, action] = p.split(':');
    const perm = await upsertPermission(resource, action);
    permMap.set(p, perm);
  }

  // 3) Sync role-permissions sesuai matrix (deterministic)
  for (const [roleName, keySet] of Object.entries(roleMatrix)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new Error(`Role "${roleName}" tidak ditemukan`);

    const desiredIds = [];
    for (const pkey of keySet) {
      const perm = permMap.get(pkey);
      if (perm) desiredIds.push(perm.id_permission);
    }

    await syncRolePermissions(role, desiredIds);
  }

  // 4) Optional: seed users demo
  const createUsers = process.env.SEED_CREATE_USERS !== 'false';
  if (createUsers) {
    const seedPassword = process.env.SEED_PASSWORD || 'gemakencana';
    const passwordHash = await bcrypt.hash(seedPassword, 10);

    await upsertUserWithRole({
      email: 'admin.saraspatika@gmail.com',
      name: 'Admin',
      roleName: 'ADMIN',
      passwordHash,
    });

    await upsertUserWithRole({
      email: 'kepalasekolah@gmail.com',
      name: 'Kepala Sekolah',
      roleName: 'KEPALA_SEKOLAH',
      passwordHash,
    });

    await upsertUserWithRole({
      email: 'guru@example.com',
      name: 'Guru',
      roleName: 'GURU',
      passwordHash,
    });

    await upsertUserWithRole({
      email: 'pegawai@example.com',
      name: 'Pegawai',
      roleName: 'PEGAWAI',
      passwordHash,
    });
  }

  console.log('Seed RBAC (ADMIN/KEPALA_SEKOLAH/GURU/PEGAWAI) ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
