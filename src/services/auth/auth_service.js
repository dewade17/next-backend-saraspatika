import bcrypt from 'bcryptjs';
import { hashPassword, verifyPassword, sixDigit } from '@/lib/crypto.js';
import { getPermSet } from '@/lib/rbac.js';
import { issueAccessToken } from '@/lib/jwt.js';
import { sendResetCode } from '@/lib/mail.js';
import { badRequest, conflict, unauthorized } from '@/lib/error.js';
import { findUserByEmail, findUserById, createUserWithRole, createPasswordResetToken, findLatestValidResetToken, consumeResetTokenAndUpdatePassword } from '@/repositories/auth/auth_repo.js';

const DEFAULT_ROLE = 'GURU';
const ALLOWED_SELF_ROLES = new Set(['GURU', 'PEGAWAI']);

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function pickSelfRole(role_name) {
  const r = role_name ? String(role_name).trim().toUpperCase() : '';
  return r && ALLOWED_SELF_ROLES.has(r) ? r : DEFAULT_ROLE;
}

export async function register({ name, email, password, role_name, autoLogin = true }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw badRequest('Email wajib diisi', { code: 'email_required' });

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) throw conflict('Email sudah terdaftar', { code: 'email_taken' });

  const roleToAssign = pickSelfRole(role_name);
  const password_hash = await hashPassword(password);

  const { user } = await createUserWithRole({
    email: normalizedEmail,
    name,
    password_hash,
    role_name: roleToAssign,
  });

  let token = null;
  if (autoLogin) {
    const perms = Array.from(await getPermSet(user.id_user));
    token = await issueAccessToken({ sub: user.id_user, email: user.email, perms }, '20m');
  }

  return { user, role_assigned: roleToAssign, token };
}

export async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);
  if (!user) throw unauthorized('Invalid credentials', { code: 'invalid_credentials' });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw unauthorized('Invalid credentials', { code: 'invalid_credentials' });

  const perms = Array.from(await getPermSet(user.id_user));
  const token = await issueAccessToken({ sub: user.id_user, email: user.email, perms }, '20m');

  return { user, token };
}

export async function requestResetToken({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  // Always return OK (avoid enumeration)
  if (!user) return { ok: true };

  const code = sixDigit();
  const code_hash = await bcrypt.hash(code, 12);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);

  await createPasswordResetToken({ id_user: user.id_user, code_hash, expires_at });
  await sendResetCode(normalizedEmail, code);

  return { ok: true };
}

export async function resetPassword({ email, code, newPassword }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  // avoid enumeration
  if (!user) return { ok: true };

  const token = await findLatestValidResetToken(user.id_user, new Date());
  if (!token) throw badRequest('Kode tidak valid', { code: 'invalid_code' });

  const match = await bcrypt.compare(String(code), token.code_hash);
  if (!match) throw badRequest('Kode tidak valid', { code: 'invalid_code' });

  const password_hash = await hashPassword(newPassword);

  await consumeResetTokenAndUpdatePassword({
    id_user: user.id_user,
    id_password_reset_token: token.id_password_reset_token,
    password_hash,
  });

  return { ok: true };
}

export async function getPrivateUserData(id_user) {
  const user = await findUserById(id_user);
  if (!user) throw unauthorized('Unauthorized', { code: 'unauthorized' });

  return {
    id_user: user.id_user,
    role: user.role,
    nama_pengguna: user.name,
  };
}
