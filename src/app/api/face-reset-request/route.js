import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute, parseBody } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';
import { buildPaginationMeta, parsePaginationParams } from '@/lib/pagination.js';
import { faceResetRequestCreateValidation } from '@/validations/face_reset_requests/face_reset_request_validation.js';
import { createFaceResetRequestService, listFaceResetRequestsService } from '@/services/face_reset_requests/face_reset_requests.js';

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
  await requirePerm(req, 'reset_wajah', 'read');

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const id_user = url.searchParams.get('id_user');
  const q = url.searchParams.get('q') || '';
  const { page, limit } = parsePaginationParams(url.searchParams);

  const result = await listFaceResetRequestsService({ status, id_user, q, page, limit });
  const data = Array.isArray(result) ? result : result?.data ?? [];
  const meta = Array.isArray(result) ? undefined : buildPaginationMeta({ page: result.page, limit: result.limit, total: result.total, q, status });

  return NextResponse.json(
    meta ? { data, meta } : { data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const POST = apiRoute(async (req) => {
  const { id_user } = await requirePerm(req, 'reset_wajah', 'create');

  const input = await parseBody(req, faceResetRequestCreateValidation);
  const data = await createFaceResetRequestService({ id_user, alasan: input.alasan });

  return NextResponse.json(
    { ok: true, data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});
