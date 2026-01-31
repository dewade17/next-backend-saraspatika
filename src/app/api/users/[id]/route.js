import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';

import { userUpdateValidation } from '@/validations/users/user_validation.js';
import { deleteUserService, getUserByIdService, updateUserService } from '@/services/users/user_service.js';
import { parseUserRequest } from '@/app/api/users/helpers.js';

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

  return { id_user };
}

export const GET = apiRoute(async (req, ctx) => {
  await requirePerm(req, 'pengguna', 'read');

  const params = await ctx.params;
  const id = params?.id;

  const user = await getUserByIdService(id);

  return NextResponse.json(
    { user },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const PATCH = apiRoute(async (req, ctx) => {
  await requirePerm(req, 'pengguna', 'update');

  const params = await ctx.params;
  const id = params?.id;

  const input = await parseUserRequest(req, userUpdateValidation);
  const user = await updateUserService(id, input);

  return NextResponse.json(
    { ok: true, user },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const DELETE = apiRoute(async (req, ctx) => {
  await requirePerm(req, 'pengguna', 'delete');

  const params = await ctx.params;
  const id = params?.id;

  const user = await deleteUserService(id);

  return NextResponse.json(
    { ok: true, user },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});
