import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';
import { pengajuanCreateValidation } from '@/validations/pengajuan/pengajuan_validation.js';
import { createPengajuanAbsensiService, listPengajuanAbsensiService } from '@/services/pengajuan/pengajuan_service.js';

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

async function parsePengajuanCreateRequest(req) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const payload = {
      jenis_pengajuan: form.get('jenis_pengajuan'),
      tanggal_mulai: form.get('tanggal_mulai'),
      tanggal_selesai: form.get('tanggal_selesai'),
      alasan: form.get('alasan'),
      foto_bukti_url: form.get('foto_bukti_url'),
    };

    const input = await pengajuanCreateValidation.parseAsync(payload);
    const file = form.get('foto_bukti') || form.get('foto_bukti_url');

    return {
      input,
      file,
    };
  }

  const json = await req.json();
  const input = await pengajuanCreateValidation.parseAsync(json);

  return {
    input,
    file: null,
  };
}

export const GET = apiRoute(async (req) => {
  const { id_user } = await requirePerm(req, 'izin', 'read');

  const url = new URL(req.url);
  const target_id_user = url.searchParams.get('id_user') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const jenis_pengajuan = url.searchParams.get('jenis_pengajuan') || undefined;

  const data = await listPengajuanAbsensiService({
    actor_id_user: id_user,
    target_id_user,
    status,
    jenis_pengajuan,
  });

  return NextResponse.json(
    { data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const POST = apiRoute(async (req) => {
  const { id_user } = await requirePerm(req, 'izin', 'create');

  const { input, file } = await parsePengajuanCreateRequest(req);

  const data = await createPengajuanAbsensiService({
    actor_id_user: id_user,
    input,
    file,
  });

  return NextResponse.json(
    { ok: true, data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});
