import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';

import { userCreateValidation } from '@/validations/users/user_validation.js';
import { createUserService, listUsersService } from '@/services/users/user_service.js';
import { parseUserRequest } from '@/app/api/users/helpers.js';

export const runtime = 'nodejs';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

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
  // PERBAIKAN: Mengubah 'pegawai' menjadi 'pengguna' sesuai seed.js
  await requirePerm('pengguna', 'read');

  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const wantsPagination = url.searchParams.has('page') || url.searchParams.has('limit') || url.searchParams.has('pageSize');
  const page = wantsPagination ? parsePositiveInt(url.searchParams.get('page'), DEFAULT_PAGE) : undefined;
  const limit = wantsPagination ? clamp(parsePositiveInt(url.searchParams.get('limit') ?? url.searchParams.get('pageSize'), DEFAULT_LIMIT), 1, MAX_LIMIT) : undefined;

  const result = await listUsersService({ q, page, limit });
  const data = Array.isArray(result) ? result : result?.data ?? [];
  const meta = Array.isArray(result)
    ? undefined
    : {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.limit > 0 ? Math.ceil(result.total / result.limit) : 0,
        q,
      };

  return NextResponse.json(
    meta ? { data, meta } : { data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const POST = apiRoute(async (req) => {
  // PERBAIKAN: Mengubah 'pegawai' menjadi 'pengguna' sesuai seed.js
  await requirePerm('pengguna', 'create');

  const input = await parseUserRequest(req, userCreateValidation);
  const user = await createUserService(input);

  return NextResponse.json(
    { ok: true, user },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});
