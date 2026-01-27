import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute, parseBody } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';

import { userCreateValidation } from '@/validations/users/user_validation.js';
import { createUserService, listUsersService } from '@/services/users/user_service.js';

export const runtime = 'nodejs';

async function requirePerm(resource, action) {
  const token = (await cookies()).get('access_token')?.value;
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

export const GET = apiRoute(async (req) => {
  await requirePerm('pegawai', 'read');

  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';

  const data = await listUsersService({ q });

  return NextResponse.json(
    { data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const POST = apiRoute(async (req) => {
  await requirePerm('pegawai', 'create');

  const input = await parseBody(req, userCreateValidation);
  const user = await createUserService(input);

  return NextResponse.json(
    { ok: true, user },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});
