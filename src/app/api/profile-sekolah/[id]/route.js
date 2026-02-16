import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute, parseBody } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';
import { profileSekolahUpdateValidation } from '@/validations/profile_sekolah/profile_sekolah_validation.js';
import {
  deleteProfileSekolahService,
  getProfileSekolahByIdService,
  updateProfileSekolahService,
} from '@/services/profile_sekolah/profile_sekolah_service.js';

export const runtime = 'nodejs';

async function requirePerm(req, resource, action) {
  const authHeader = req.headers.get('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    token = (await cookies()).get('access_token')?.value;
  }

  if (!token) throw unauthorized('Unauthorized', { code: 'unauthorized' });

  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch (err) {
    throw unauthorized('Token tidak valid', { code: 'token_invalid', cause: err });
  }

  const id_user = String(payload?.sub || '').trim();
  if (!id_user) throw unauthorized('Unauthorized', { code: 'unauthorized' });

  const perms = payload?.perms || [];
  let allowed = canFromClaims(perms, resource, action);

  if (!allowed) {
    const set = await getPermSet(id_user);
    allowed = set.has(`${String(resource).toLowerCase()}:${String(action).toLowerCase()}`);
  }

  if (!allowed) throw forbidden('Forbidden', { code: 'forbidden' });
}

export const GET = apiRoute(async (req, ctx) => {
  await requirePerm(req, 'profile_sekolah', 'read');

  const params = await ctx.params;
  const id = params?.id;
  const data = await getProfileSekolahByIdService(id);

  return NextResponse.json({ data, message: 'Berhasil mengambil profile sekolah' }, { headers: { 'Cache-Control': 'no-store' } });
});

export const PATCH = apiRoute(async (req, ctx) => {
  await requirePerm(req, 'profile_sekolah', 'update');

  const params = await ctx.params;
  const id = params?.id;

  const input = await parseBody(req, profileSekolahUpdateValidation);
  const data = await updateProfileSekolahService(id, input);

  return NextResponse.json({ ok: true, data, message: 'Profile sekolah berhasil diperbarui' }, { headers: { 'Cache-Control': 'no-store' } });
});

export const DELETE = apiRoute(async (req, ctx) => {
  await requirePerm(req, 'profile_sekolah', 'delete');

  const params = await ctx.params;
  const id = params?.id;
  const data = await deleteProfileSekolahService(id);

  return NextResponse.json({ ok: true, data, message: 'Profile sekolah berhasil dihapus' }, { headers: { 'Cache-Control': 'no-store' } });
});
