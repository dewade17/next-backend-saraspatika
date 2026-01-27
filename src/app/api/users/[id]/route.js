import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute, parseBody } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';

import { userUpdateValidation } from '@/validations/users/user_validation.js';
import { deleteUserService, getUserByIdService, updateUserService } from '@/services/users/user_service.js';

async function requirePerm(resource, action) {
  const token = (await cookies()).get('access_token')?.value;
  if (!token) throw unauthorized('Unauthorized', { code: 'unauthorized' });

  const payload = await verifyAccessToken(token);
  const id = payload?.sub;
  if (!id) throw unauthorized('Unauthorized', { code: 'unauthorized' });

  const perms = payload?.perms || [];
  let allowed = canFromClaims(perms, resource, action);
  if (!allowed) {
    const set = await getPermSet(id);
    allowed = set.has(`${String(resource).toLowerCase()}:${String(action).toLowerCase()}`);
  }
  if (!allowed) throw forbidden('Forbidden', { code: 'forbidden' });

  return { id };
}

export const GET = apiRoute(async (_req, ctx) => {
  await requirePerm('pegawai', 'read');

  const id = ctx?.params?.id;
  const user = await getUserByIdService(id);

  return NextResponse.json(
    { user },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const PATCH = apiRoute(async (req, ctx) => {
  await requirePerm('pegawai', 'update');

  const id = ctx?.params?.id;
  const input = await parseBody(req, userUpdateValidation);

  const user = await updateUserService(id, input);

  return NextResponse.json(
    { ok: true, user },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const DELETE = apiRoute(async (_req, ctx) => {
  await requirePerm('pegawai', 'delete');

  const id = ctx?.params?.id;
  const user = await deleteUserService(id);

  return NextResponse.json(
    { ok: true, user },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});
