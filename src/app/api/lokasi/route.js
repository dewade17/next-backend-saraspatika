import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute, parseBody } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';
import { lokasiCreateValidation } from '@/validations/lokasi/lokasi_validation.js';
import { createLokasiService, listLokasiService } from '@/services/lokasi/lokasi_service.js';

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

export const GET = apiRoute(async () => {
  await requirePerm('lokasi', 'read');

  const data = await listLokasiService();

  return NextResponse.json(
    { data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const POST = apiRoute(async (req) => {
  await requirePerm('lokasi', 'create');

  const input = await parseBody(req, lokasiCreateValidation);
  const data = await createLokasiService(input);

  return NextResponse.json(
    { ok: true, data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});
