import { badRequest, forbidden, notFound } from '@/lib/error.js';
import { formatToDbDate } from '@/lib/date_helper.js';
import { compareTime, combineDateAndTime } from '@/lib/time_helper.js';
import { uploadToNextcloud } from '@/app/api/agenda/helper.js';
import { create, findById, findMany, remove, update } from '@/repositories/agenda/agenda_repo.js';
import { findById as findUserById } from '@/repositories/users/user_repo.js';

function normalizeUserId(id_user) {
  const id = String(id_user || '').trim();
  if (!id) throw badRequest('ID user tidak valid', { code: 'id_user_invalid' });
  return id;
}

function normalizeOptionalText(value) {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || null;
}

function toAgendaDateTime(tanggal, jam, fieldName) {
  const combined = combineDateAndTime(tanggal, jam);
  if (!combined) {
    throw badRequest(`${fieldName} tidak valid`, { code: `${fieldName}_invalid` });
  }
  return combined;
}

function toTanggalDate(tanggal) {
  const dbDate = formatToDbDate(tanggal);
  if (!dbDate) {
    throw badRequest('Tanggal tidak valid', { code: 'tanggal_invalid' });
  }
  return new Date(`${dbDate}T00:00:00.000Z`);
}

function assertTimeRange(jam_mulai, jam_selesai) {
  const compare = compareTime(jam_mulai, jam_selesai);
  if (compare == null) {
    throw badRequest('Jam agenda tidak valid', { code: 'jam_invalid' });
  }
  if (compare >= 0) {
    throw badRequest('Jam selesai harus lebih besar dari jam mulai', { code: 'jam_range_invalid' });
  }
}

async function uploadBuktiPendukung(file) {
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    return null;
  }

  return await uploadToNextcloud(file, {
    folder: 'agenda',
    filename: file.name || 'bukti-pendukung',
  });
}

function resolveKategoriAgendaByRole(role) {
  const normalizedRole = String(role || '')
    .trim()
    .toUpperCase();

  if (normalizedRole === 'GURU') return 'MENGAJAR';
  if (normalizedRole === 'KEPALA_SEKOLAH' || normalizedRole === 'PEGAWAI') return 'KERJA';

  throw forbidden('Role user tidak diizinkan membuat agenda', { code: 'agenda_role_forbidden' });
}

async function getKategoriAgendaByUserId(id_user) {
  const user = await findUserById(id_user);
  if (!user) {
    throw notFound('User tidak ditemukan', { code: 'user_not_found' });
  }

  return resolveKategoriAgendaByRole(user.role);
}

async function getAgendaOwnedOrThrow(id_agenda, actor_id_user) {
  const agenda = await findById(String(id_agenda || '').trim());
  if (!agenda) {
    throw notFound('Agenda tidak ditemukan', { code: 'agenda_not_found' });
  }

  const actorId = normalizeUserId(actor_id_user);
  if (agenda.id_user !== actorId) {
    throw forbidden('Anda tidak memiliki akses untuk agenda ini', { code: 'agenda_forbidden' });
  }

  return agenda;
}

export async function createAgendaService({ actor_id_user, input, file }) {
  const id_user = normalizeUserId(actor_id_user);
  const kategori_agenda = await getKategoriAgendaByUserId(id_user);

  assertTimeRange(input.jam_mulai, input.jam_selesai);

  const bukti_pendukung_url = (await uploadBuktiPendukung(file)) ?? normalizeOptionalText(input.bukti_pendukung_url) ?? null;

  return await create({
    id_user,
    deskripsi: input.deskripsi,
    kategori_agenda,
    tanggal: toTanggalDate(input.tanggal),
    jam_mulai: toAgendaDateTime(input.tanggal, input.jam_mulai, 'jam_mulai'),
    jam_selesai: toAgendaDateTime(input.tanggal, input.jam_selesai, 'jam_selesai'),
    bukti_pendukung_url,
  });
}

export async function listAgendaService(actor_id_user) {
  const id_user = normalizeUserId(actor_id_user);
  return await findMany({ id_user });
}

export async function updateAgendaService(id_agenda, actor_id_user, input, file) {
  const agenda = await getAgendaOwnedOrThrow(id_agenda, actor_id_user);

  const tanggalInput = input.tanggal ?? formatToDbDate(agenda.tanggal);
  const jamMulaiInput = input.jam_mulai ?? agenda.jam_mulai;
  const jamSelesaiInput = input.jam_selesai ?? agenda.jam_selesai;

  assertTimeRange(jamMulaiInput, jamSelesaiInput);

  const data = {};
  data.kategori_agenda = await getKategoriAgendaByUserId(agenda.id_user);

  if (input.deskripsi !== undefined) data.deskripsi = input.deskripsi;
  if (input.tanggal !== undefined) data.tanggal = toTanggalDate(input.tanggal);

  if (input.tanggal !== undefined || input.jam_mulai !== undefined) {
    data.jam_mulai = toAgendaDateTime(tanggalInput, jamMulaiInput, 'jam_mulai');
  }

  if (input.tanggal !== undefined || input.jam_selesai !== undefined) {
    data.jam_selesai = toAgendaDateTime(tanggalInput, jamSelesaiInput, 'jam_selesai');
  }

  const uploadedUrl = await uploadBuktiPendukung(file);
  if (uploadedUrl) {
    data.bukti_pendukung_url = uploadedUrl;
  } else if (input.bukti_pendukung_url !== undefined) {
    data.bukti_pendukung_url = normalizeOptionalText(input.bukti_pendukung_url);
  }

  return await update(agenda.id_agenda, data);
}

export async function deleteAgendaService(id_agenda, actor_id_user) {
  const agenda = await getAgendaOwnedOrThrow(id_agenda, actor_id_user);
  return await remove(agenda.id_agenda);
}
