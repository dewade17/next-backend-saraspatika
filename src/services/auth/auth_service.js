import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword, sixDigit } from '@/lib/crypto.js';
import { getPermSet } from '@/lib/rbac_server.js';
import { ACCESS_TOKEN_TTL, issueAccessToken } from '@/lib/jwt.js';
import { sendResetCode } from '@/lib/mail.js';
import { badRequest, conflict, unauthorized } from '@/lib/error.js';
import { findUserByEmail, findUserById, findUserDeviceByHash, bindOrTouchUserDevice, createUserWithRole, createPasswordResetToken, findLatestValidResetToken, findValidResetTokenById, consumeResetTokenAndUpdatePassword } from '@/repositories/auth/auth_repo.js';

const DEFAULT_ROLE = 'GURU';
const ALLOWED_SELF_ROLES = new Set(['GURU', 'PEGAWAI']);
const INVALID_CREDENTIALS_MESSAGE = 'Email atau kata sandi yang Anda masukkan salah. Silakan coba lagi.';
const DEVICE_LOCKED_MESSAGE = 'Akun ini sudah terdaftar di perangkat lain.';
const DEVICE_USED_MESSAGE = 'Perangkat ini sudah terdaftar untuk akun lain.';
const PASSWORD_SETUP_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const INVALID_SET_PASSWORD_TOKEN_MESSAGE = 'Link set password tidak valid atau sudah kedaluwarsa.';

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function pickSelfRole(role_name) {
  const r = role_name ? String(role_name).trim().toUpperCase() : '';
  return r && ALLOWED_SELF_ROLES.has(r) ? r : DEFAULT_ROLE;
}

function normalizeOptionalText(value) {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
}

function hashDeviceId(deviceId) {
  const normalized = String(deviceId ?? '').trim();
  if (!normalized) throw badRequest('ID perangkat wajib diisi', { code: 'device_id_required' });
  return createHash('sha256').update(normalized).digest('hex');
}

function sessionVersionOf(user) {
  return Number.isInteger(user?.session_version) ? user.session_version : 0;
}

function splitPasswordSetupToken(token) {
  const value = String(token ?? '').trim();
  const separatorIndex = value.indexOf('.');

  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    throw badRequest(INVALID_SET_PASSWORD_TOKEN_MESSAGE, { code: 'invalid_set_password_token' });
  }

  return {
    id_password_reset_token: value.slice(0, separatorIndex),
    rawToken: value.slice(separatorIndex + 1),
  };
}

async function issueUserToken({ user, perms, deviceIdHash }) {
  return await issueAccessToken(
    {
      sub: user.id_user,
      email: user.email,
      perms,
      sessionVersion: sessionVersionOf(user),
      ...(deviceIdHash ? { deviceIdHash } : {}),
    },
    ACCESS_TOKEN_TTL,
  );
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
    token = await issueUserToken({ user, perms });
  }

  return { user, role_assigned: roleToAssign, token };
}

export async function login({ email, password, deviceId, deviceName, devicePlatform }, meta = {}) {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);
  if (!user) throw unauthorized(INVALID_CREDENTIALS_MESSAGE, { code: 'invalid_credentials' });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw unauthorized(INVALID_CREDENTIALS_MESSAGE, { code: 'invalid_credentials' });

  const deviceIdHash = hashDeviceId(deviceId);
  const deviceUsed = await findUserDeviceByHash(deviceIdHash);

  if (deviceUsed && deviceUsed.id_user !== user.id_user) {
    throw conflict(DEVICE_USED_MESSAGE, { code: 'device_registered_to_other_user' });
  }

  const binding = await bindOrTouchUserDevice({
    id_user: user.id_user,
    device_id_hash: deviceIdHash,
    device_name: normalizeOptionalText(deviceName),
    device_platform: normalizeOptionalText(devicePlatform),
    last_ip: normalizeOptionalText(meta.ip),
    last_user_agent: normalizeOptionalText(meta.userAgent),
  });

  if (!binding.matched) {
    throw conflict(DEVICE_LOCKED_MESSAGE, { code: 'account_registered_to_other_device' });
  }

  const perms = Array.from(await getPermSet(user.id_user));
  const token = await issueUserToken({ user, perms, deviceIdHash });

  return { user, token, device: binding.device };
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

export async function createPasswordSetupToken({ id_user }) {
  const rawToken = randomBytes(32).toString('base64url');
  const code_hash = await bcrypt.hash(rawToken, 12);
  const expires_at = new Date(Date.now() + PASSWORD_SETUP_TOKEN_TTL_MS);

  const token = await createPasswordResetToken({ id_user, code_hash, expires_at });

  return {
    token: `${token.id_password_reset_token}.${rawToken}`,
    expires_at,
  };
}

export async function setPasswordWithToken({ token, newPassword }) {
  const { id_password_reset_token, rawToken } = splitPasswordSetupToken(token);
  const resetToken = await findValidResetTokenById(id_password_reset_token, new Date());

  if (!resetToken) {
    throw badRequest(INVALID_SET_PASSWORD_TOKEN_MESSAGE, { code: 'invalid_set_password_token' });
  }

  const match = await bcrypt.compare(rawToken, resetToken.code_hash);
  if (!match) {
    throw badRequest(INVALID_SET_PASSWORD_TOKEN_MESSAGE, { code: 'invalid_set_password_token' });
  }

  const password_hash = await hashPassword(newPassword);

  await consumeResetTokenAndUpdatePassword({
    id_user: resetToken.id_user,
    id_password_reset_token: resetToken.id_password_reset_token,
    password_hash,
  });

  return { ok: true };
}

export async function getPrivateUserData(id_user) {
  const user = await findUserById(id_user);
  if (!user) throw unauthorized('Unauthorized', { code: 'unauthorized' });
  const permissions = Array.from(await getPermSet(user.id_user));

  return {
    id_user: user.id_user,
    role: user.role,
    nama_pengguna: user.name,
    permissions,
  };
}
