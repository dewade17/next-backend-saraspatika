import { hashPassword } from '@/lib/crypto.js';
import { clearPermCache } from '@/lib/rbac_server.js';
import { badRequest } from '@/lib/error.js';
import { createUserWithRole, deleteUser, getUserById, listUsers, updateUserWithRole } from '@/repositories/users/user_repo.js';

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function normalizeRole(role) {
  const r = String(role || '')
    .trim()
    .toUpperCase();
  return r || 'GURU';
}

export async function listUsersService({ q } = {}) {
  return await listUsers({ q });
}

export async function getUserByIdService(id_user) {
  const user = await getUserById(id_user);
  if (!user) throw badRequest('User tidak ditemukan', { code: 'user_not_found', status: 404 });
  return user;
}

export async function createUserService(input) {
  const email = normalizeEmail(input.email);
  if (!email) throw badRequest('Email wajib diisi', { code: 'email_required' });

  const role_name = normalizeRole(input.role);

  const password = String(input.password || '');
  if (!password) throw badRequest('Password wajib diisi', { code: 'password_required' });

  const password_hash = await hashPassword(password);

  const user = await createUserWithRole({
    email,
    name: input.name ?? null,
    password_hash,
    status: input.status ?? null,
    nomor_handphone: input.nomor_handphone ?? null,
    nip: input.nip ?? null,
    foto_profil_url: input.foto_profil_url ?? null,
    role_name,
  });

  clearPermCache(user.id_user);
  return user;
}

export async function updateUserService(id_user, input) {
  const data = {};

  if (input.email !== undefined) data.email = normalizeEmail(input.email);
  if (input.name !== undefined) data.name = input.name;
  if (input.status !== undefined) data.status = input.status;
  if (input.nomor_handphone !== undefined) data.nomor_handphone = input.nomor_handphone;
  if (input.nip !== undefined) data.nip = input.nip;

  // Gunakan undefined check agar null (hapus foto) bisa lewat
  if (input.foto_profil_url !== undefined) {
    data.foto_profil_url = input.foto_profil_url;
  }

  if (input.password !== undefined) {
    data.password_hash = await hashPassword(String(input.password));
  }

  if (input.role !== undefined) {
    data.role_name = normalizeRole(input.role);
  }

  const user = await updateUserWithRole(id_user, data);
  clearPermCache(id_user);
  return user;
}

export async function deleteUserService(id_user) {
  const user = await deleteUser(id_user);
  clearPermCache(id_user);
  return user;
}
