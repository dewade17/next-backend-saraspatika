import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api.js';
import { forbidden, unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';
import { pengajuanUpdateStatusValidation, pengajuanUpdateValidation } from '@/validations/pengajuan/pengajuan_validation.js';
import { deletePengajuanAbsensiService, getPengajuanAbsensiByIdService, updatePengajuanAbsensiService, updateStatusPengajuanAbsensiService } from '@/services/pengajuan/pengajuan_service.js';

export const runtime = 'nodejs';

function getFormText(form, key, fallback = undefined) {
  const value = form.get(key);
  if (typeof value !== 'string') return fallback;
  return value;
}

async function parsePengajuanPatchRequest(req) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const rawPayload = {
      status: getFormText(form, 'status'),
      admin_note: getFormText(form, 'admin_note'),
      jenis_pengajuan: getFormText(form, 'jenis_pengajuan'),
      tanggal_mulai: getFormText(form, 'tanggal_mulai'),
      tanggal_selesai: getFormText(form, 'tanggal_selesai'),
      alasan: getFormText(form, 'alasan'),
      foto_bukti_url: getFormText(form, 'foto_bukti_url'),
    };

    const payload = Object.fromEntries(Object.entries(rawPayload).filter(([, value]) => value !== undefined));

    const hasStatus = Object.prototype.hasOwnProperty.call(payload, 'status');

    if (hasStatus) {
      const input = await pengajuanUpdateStatusValidation.parseAsync(payload);
      return { mode: 'status', input, file: null };
    }

    const input = await pengajuanUpdateValidation.parseAsync(payload);
    const file = form.get('foto_bukti') || form.get('foto_bukti_url');
    return { mode: 'data', input, file };
  }

  const json = await req.json();
  const hasStatus = Object.prototype.hasOwnProperty.call(json, 'status');

  if (hasStatus) {
    const input = await pengajuanUpdateStatusValidation.parseAsync(json);
    return { mode: 'status', input, file: null };
  }

  const input = await pengajuanUpdateValidation.parseAsync(json);
  return { mode: 'data', input, file: null };
}

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
  const { id_user } = await requirePerm(req, 'izin', 'read');

  const params = await ctx.params;
  const id = params?.id;

  const data = await getPengajuanAbsensiByIdService(id, id_user);

  return NextResponse.json(
    { data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const PATCH = apiRoute(async (req, ctx) => {
  const { id_user } = await requirePerm(req, 'izin', 'update');

  const params = await ctx.params;
  const id = params?.id;

  const { mode, input, file } = await parsePengajuanPatchRequest(req);

  const data = mode === 'status' ? await updateStatusPengajuanAbsensiService(id, input, id_user) : await updatePengajuanAbsensiService(id, input, file, id_user);

  return NextResponse.json(
    { ok: true, data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});

export const DELETE = apiRoute(async (req, ctx) => {
  const { id_user } = await requirePerm(req, 'izin', 'delete');

  const params = await ctx.params;
  const id = params?.id;

  const data = await deletePengajuanAbsensiService(id, id_user);

  return NextResponse.json(
    { ok: true, data },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
});
