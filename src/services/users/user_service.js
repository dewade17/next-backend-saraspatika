import { randomInt } from 'node:crypto';
import { hashPassword } from '@/lib/crypto.js';
import { sendInitialAccountPassword } from '@/lib/mail.js';
import { clearPermCache } from '@/lib/rbac_server.js';
import { badRequest } from '@/lib/error.js';
import { createUserWithRole, deleteUser, getUserById, listUsers, resetUserDevice, updateUserWithRole } from '@/repositories/users/user_repo.js';

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

function pickRandom(chars) {
  return chars[randomInt(0, chars.length)];
}

function generateInitialPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  const all = upper + lower + digits + symbols;

  const chars = [pickRandom(upper), pickRandom(lower), pickRandom(digits), pickRandom(symbols)];
  while (chars.length < 12) chars.push(pickRandom(all));

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

function resolveInitialPassword(inputPassword) {
  const password = String(inputPassword ?? '').trim();
  return password || generateInitialPassword();
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
  const password = resolveInitialPassword(input.password);
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

  try {
    await sendInitialAccountPassword({
      email: user.email,
      name: user.name,
      password,
    });
  } catch (err) {
    throw badRequest('Pengguna dibuat, tetapi email password gagal dikirim. Periksa konfigurasi email.', {
      code: 'initial_password_email_failed',
      cause: err,
    });
  }

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

export async function resetUserDeviceService(id_user) {
  const id = String(id_user ?? '').trim();
  if (!id) throw badRequest('ID user tidak valid', { code: 'id_user_invalid' });

  const user = await resetUserDevice(id);
  clearPermCache(id);
  return user;
}
