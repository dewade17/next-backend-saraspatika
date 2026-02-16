import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api.js';
import { badRequest, unauthorized, forbidden } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';
import { agendaUpdateSchema } from '@/validations/agenda/agenda_validation.js';
import { deleteAgendaService, updateAgendaService } from '@/services/agenda/agenda_service.js';

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

function getFormText(form, key) {
  const value = form.get(key);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

async function parseAgendaPatchRequest(req) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();

    const raw = {
      deskripsi: getFormText(form, 'deskripsi'),
      tanggal: getFormText(form, 'tanggal'),
      jam_mulai: getFormText(form, 'jam_mulai'),
      jam_selesai: getFormText(form, 'jam_selesai'),
      bukti_pendukung_url: getFormText(form, 'bukti_pendukung_url'),
    };

    const payload = Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined));
    const input = await agendaUpdateSchema.parseAsync(payload);
    const file = form.get('bukti_pendukung') || form.get('bukti_pendukung_url');

    return { input, file };
  }

  const json = await req.json();
  const input = await agendaUpdateSchema.parseAsync(json);
  return { input, file: null };
}

export const PATCH = apiRoute(async (req, ctx) => {
  const { id_user } = await requirePerm(req, 'agenda', 'update');
  const params = await ctx.params;
  const id = String(params?.id || '').trim();
  if (!id) throw badRequest('ID agenda tidak valid', { code: 'id_agenda_invalid' });

  const { input, file } = await parseAgendaPatchRequest(req);
  const data = await updateAgendaService(id, id_user, input, file);

  return NextResponse.json({ ok: true, data, message: 'Agenda berhasil diperbarui' }, { headers: { 'Cache-Control': 'no-store' } });
});

export const DELETE = apiRoute(async (req, ctx) => {
  const { id_user } = await requirePerm(req, 'agenda', 'delete');
  const params = await ctx.params;
  const id = String(params?.id || '').trim();
  if (!id) throw badRequest('ID agenda tidak valid', { code: 'id_agenda_invalid' });

  const data = await deleteAgendaService(id, id_user);

  return NextResponse.json({ ok: true, data, message: 'Agenda berhasil dihapus' }, { headers: { 'Cache-Control': 'no-store' } });
});
