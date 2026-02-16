import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';
import { listAbsensiService } from '@/services/absensi/absensi_service.js';

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

export const GET = apiRoute(async (req) => {
  const { id_user: loggedInUserId } = await requirePerm(req, 'absensi', 'read');

  const url = new URL(req.url);
  const role = url.searchParams.get('role') || null;
  const start_date = url.searchParams.get('start_date') || null;
  const end_date = url.searchParams.get('end_date') || null;
  const q = url.searchParams.get('q') || '';
  const limit = url.searchParams.get('limit') || null;

  const userIdParam = url.searchParams.get('userId')?.trim();
  const targetUserId = userIdParam || (role ? null : loggedInUserId);

  const data = await listAbsensiService({
    role,
    start_date,
    end_date,
    q,
    limit: limit ? Number(limit) : undefined,
    id_user: targetUserId,
  });

  return NextResponse.json(
    { data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});
