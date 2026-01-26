import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt.js';
import { getPermSet, canFromClaims } from '@/lib/rbac.js';
import { unauthorized, forbidden } from '@/lib/error.js';

async function readTokenFromCookie() {
  const token = (await cookies()).get('access_token')?.value;
  return token ? String(token) : null;
}

/**
 * @returns {Promise<{ token: string|null, id_user: number|null, perms: string[], claims: any|null }>}
 */
export async function getAuthContext() {
  const token = await readTokenFromCookie();
  if (!token) return { token: null, id_user: null, perms: [], claims: null };

  try {
    const claims = await verifyAccessToken(token);
    const id_user = claims?.sub ?? null;
    const perms = Array.isArray(claims?.perms) ? claims.perms : [];
    return { token, id_user, perms, claims };
  } catch {
    return { token: null, id_user: null, perms: [], claims: null };
  }
}

/**
 * Wajib login (token cookie ada & valid).
 * handler(req, { auth })
 */
export function requireToken(handler) {
  return async (req, ctx = {}) => {
    const auth = await getAuthContext();
    if (!auth.id_user) throw unauthorized('Unauthorized', { code: 'unauthorized' });
    return await handler(req, { ...ctx, auth });
  };
}

/**
 * Token opsional (kalau ada diparse, kalau tidak tetap lanjut).
 * handler(req, { auth })
 */
export function optionalToken(handler) {
  return async (req, ctx = {}) => {
    const auth = await getAuthContext();
    return await handler(req, { ...ctx, auth });
  };
}

/**
 * Wajib login + wajib permission (RBAC).
 * - cek cepat dari claims perms
 * - fallback: cek DB permission set (kalau claims kurang lengkap / outdated)
 *
 * handler(req, { auth })
 */
export function requirePermission(resource, action, handler) {
  return async (req, ctx = {}) => {
    const auth = await getAuthContext();
    if (!auth.id_user) throw unauthorized('Unauthorized', { code: 'unauthorized' });

    let allowed = canFromClaims(auth.perms, resource, action);

    if (!allowed) {
      const set = await getPermSet(auth.id_user);
      allowed = set.has(`${resource}:${action}`);
    }

    if (!allowed) throw forbidden('Forbidden', { code: 'forbidden' });
    return await handler(req, { ...ctx, auth });
  };
}

// Backward compatible alias (kalau nanti sudah terlanjur pakai nama lama)
export const requireCrud = requirePermission;
