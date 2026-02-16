import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api.js';
import { unauthorized, forbidden } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { canFromClaims, getPermSet } from '@/lib/rbac_server.js';
import { agendaSchema } from '@/validations/agenda/agenda_validation.js';
import { createAgendaService, listAgendaService } from '@/services/agenda/agenda_service.js';

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

async function parseAgendaCreateRequest(req) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();

    const payload = {
      deskripsi: getFormText(form, 'deskripsi'),
      tanggal: getFormText(form, 'tanggal'),
      jam_mulai: getFormText(form, 'jam_mulai'),
      jam_selesai: getFormText(form, 'jam_selesai'),
      bukti_pendukung_url: getFormText(form, 'bukti_pendukung_url'),
    };

    const input = await agendaSchema.parseAsync(payload);
    const file = form.get('bukti_pendukung') || form.get('bukti_pendukung_url');

    return { input, file };
  }

  const json = await req.json();
  const input = await agendaSchema.parseAsync(json);
  return { input, file: null };
}

export const GET = apiRoute(async (req) => {
  const { id_user } = await requirePerm(req, 'agenda', 'read');
  const data = await listAgendaService(id_user);

  return NextResponse.json({ data, message: 'Berhasil mengambil daftar agenda' }, { headers: { 'Cache-Control': 'no-store' } });
});

export const POST = apiRoute(async (req) => {
  const { id_user } = await requirePerm(req, 'agenda', 'create');
  const { input, file } = await parseAgendaCreateRequest(req);

  const data = await createAgendaService({
    actor_id_user: id_user,
    input,
    file,
  });

  return NextResponse.json({ ok: true, data, message: 'Agenda berhasil dibuat' }, { headers: { 'Cache-Control': 'no-store' } });
});
