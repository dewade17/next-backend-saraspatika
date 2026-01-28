const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- HELPER FUNCTIONS ---

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
 * Helper untuk memberikan/mencabut izin spesifik per User (Hybrid RBAC).
 * Fitur ini disiapkan untuk kebutuhan manajemen user spesifik di masa depan.
 */
async function upsertUserOverride(email, resource, action, isGrant = true) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.warn(`⚠️ User ${email} tidak ditemukan, skip override.`);
    return;
  }

  const r = norm(resource);
  const a = norm(action);

  const perm = await prisma.permission.findUnique({
    where: { resource_action: { resource: r, action: a } },
  });

  if (!perm) {
    console.warn(`⚠️ Permission ${r}:${a} tidak ditemukan di database.`);
    return;
  }

  await prisma.userPermissionOverride.upsert({
    where: {
      id_user_id_permission: {
        id_user: user.id_user,
        id_permission: perm.id_permission,
      },
    },
    update: { grant: isGrant },
    create: {
      id_user: user.id_user,
      id_permission: perm.id_permission,
      grant: isGrant,
    },
  });

  console.log(`   ✨ Override Akses: ${email} -> [${r}:${a}] = ${isGrant ? 'DIZINKAN' : 'DILARANG'}`);
}

function buildRoleMatrix() {
  const CRUD = ['create', 'read', 'update', 'delete'];
  const roles = ['ADMIN', 'KEPALA_SEKOLAH', 'GURU', 'PEGAWAI'];

  const matrix = {};
  roles.forEach((r) => (matrix[r] = new Set()));

  const grant = (targetRoles, resource, actions) => {
    const acts = Array.isArray(actions) ? actions : [actions];
    targetRoles.forEach((roleName) => {
      const set = matrix[roleName];
      if (set) acts.forEach((a) => set.add(key(resource, a)));
    });
  };

  // 1. WEWENANG GURU & PEGAWAI (Operasional Daily)
  grant(roles, 'auth', ['login', 'logout', 'request_token', 'reset_password']);
  grant(roles, 'profile', ['read', 'update']);

  // Fitur inti Guru & Pegawai
  grant(['GURU', 'PEGAWAI'], 'absensi', ['create', 'read', 'update']);
  grant(['GURU', 'PEGAWAI'], 'wajah', ['create', 'read']);
  grant(['GURU', 'PEGAWAI'], 'agenda', CRUD);
  grant(['GURU', 'PEGAWAI'], 'izin', ['create', 'read', 'update']);

  // 2. WEWENANG ADMIN & KEPALA SEKOLAH (Manajerial)
  const manajerial = ['ADMIN', 'KEPALA_SEKOLAH'];

  grant(manajerial, 'absensi', ['read']);
  grant(manajerial, 'agenda', ['read']);
  grant(manajerial, 'pengguna', CRUD);
  grant(manajerial, 'wajah', ['read', 'delete']);
  grant(manajerial, 'lokasi', CRUD);
  grant(manajerial, 'pola_jam_kerja', CRUD);
  grant(manajerial, 'profile_sekolah', CRUD);
  grant(manajerial, 'izin', ['read', 'update']);

  // Superuser: ADMIN mendapatkan akses dari semua role
  for (const [roleName, set] of Object.entries(matrix)) {
    if (roleName === 'ADMIN') continue;
    set.forEach((p) => matrix.ADMIN.add(p));
  }

  return matrix;
}

async function syncRolePermissions(role, desiredPermissionIds) {
  // Hapus permission yang sudah tidak relevan
  await prisma.rolePermission.deleteMany({
    where: {
      id_role: role.id_role,
      NOT: { id_permission: { in: desiredPermissionIds } },
    },
  });

  // Tambahkan/Update permission baru
  for (const id_permission of desiredPermissionIds) {
    await prisma.rolePermission.upsert({
      where: { id_role_id_permission: { id_role: role.id_role, id_permission } },
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
      role: roleName,
    },
  });

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`Role "${roleName}" tidak ditemukan`);

  await prisma.userRole.deleteMany({
    where: { id_user: user.id_user, NOT: { id_role: role.id_role } },
  });

  await prisma.userRole.upsert({
    where: { id_user_id_role: { id_user: user.id_user, id_role: role.id_role } },
    update: {},
    create: { id_user: user.id_user, id_role: role.id_role },
  });

  return user;
}

// --- MAIN EXECUTION ---

async function main() {
  const roleMatrix = buildRoleMatrix();

  // 1. Setup Roles
  await upsertRole('ADMIN', 'Administrator sistem');
  await upsertRole('KEPALA_SEKOLAH', 'Kepala sekolah');
  await upsertRole('GURU', 'Tenaga Pendidik');
  await upsertRole('PEGAWAI', 'Tenaga Kependidikan');

  // 2. Setup Permissions & Role Bindings
  const allPermKeys = new Set();
  Object.values(roleMatrix).forEach((set) => set.forEach((p) => allPermKeys.add(p)));

  const permMap = new Map();
  for (const p of allPermKeys) {
    const [resource, action] = p.split(':');
    const perm = await upsertPermission(resource, action);
    permMap.set(p, perm);
  }

  for (const [roleName, keySet] of Object.entries(roleMatrix)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    const desiredIds = Array.from(keySet)
      .map((pkey) => permMap.get(pkey)?.id_permission)
      .filter(Boolean);
    await syncRolePermissions(role, desiredIds);
  }

  // 3. Seed Users Default
  if (process.env.SEED_CREATE_USERS !== 'false') {
    const seedPassword = process.env.SEED_PASSWORD || 'gemakencana';
    const passwordHash = await bcrypt.hash(seedPassword, 10);

    const usersToSeed = [
      { email: 'admin.saraspatika@gmail.com', name: 'Admin Utama', role: 'ADMIN' },
      { email: 'kepsek@example.com', name: 'Kepala Sekolah', role: 'KEPALA_SEKOLAH' },
      { email: 'guru@example.com', name: 'Guru Contoh', role: 'GURU' },
    ];

    for (const u of usersToSeed) {
      await upsertUserWithRole({ email: u.email, name: u.name, roleName: u.role, passwordHash });
    }
  }

  console.log('Seed RBAC Berhasil ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
