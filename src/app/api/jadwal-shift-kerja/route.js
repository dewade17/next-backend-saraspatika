import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute, parseBody } from '@/lib/api.js';
import { badRequest, forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';
import { shiftAssignmentBulkValidation } from '@/validations/shift_kerja/jadwal_shift_kerja_validation.js';
import { listJadwalShiftKerjaService, upsertJadwalShiftKerjaService } from '@/services/shift_kerja/jadwal_shift_kerja_service.js';

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
  await requirePerm('shift_kerja', 'read');

  const { searchParams } = new URL(req.url);
  const start_date = searchParams.get('start_date');
  const end_date = searchParams.get('end_date');
  const user_ids = searchParams.getAll('user_id');

  if (!start_date || !end_date) {
    throw badRequest('start_date dan end_date wajib diisi', { code: 'date_range_required' });
  }

  const data = await listJadwalShiftKerjaService({ start_date, end_date, user_ids: user_ids.length ? user_ids : undefined });

  return NextResponse.json(
    { data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const POST = apiRoute(async (req) => {
  await requirePerm('shift_kerja', 'update');

  const input = await parseBody(req, shiftAssignmentBulkValidation);
  const data = await upsertJadwalShiftKerjaService(input.assignments);

  return NextResponse.json(
    { ok: true, data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});
