import dayjs from 'dayjs';
import { badRequest } from '@/lib/error.js';
import { prisma } from '@/lib/db.js';
import { deleteJadwalShiftKerja, listJadwalShiftKerja, upsertJadwalShiftKerja } from '@/repositories/shift_kerja/jadwal_shift_kerja_repo.js';

function normalizeId(value, label) {
  const v = String(value || '').trim();
  if (!v) throw badRequest(`${label} tidak valid`, { code: `${label}_invalid` });
  return v;
}

function normalizeDate(value, label) {
  const d = dayjs(value).startOf('day');
  if (!d.isValid()) throw badRequest(`${label} tidak valid`, { code: `${label}_invalid` });
  return d.toDate();
}

function formatDateOnly(value) {
  const d = dayjs(value);
  return d.isValid() ? d.format('YYYY-MM-DD') : null;
}

function serializeRow(row) {
  if (!row) return row;
  return {
    ...row,
    tanggal: formatDateOnly(row.tanggal),
  };
}

export async function listJadwalShiftKerjaService({ start_date, end_date, user_ids } = {}) {
  const startDate = normalizeDate(start_date, 'start_date');
  const endDate = normalizeDate(end_date, 'end_date');

  if (dayjs(startDate).isAfter(endDate, 'day')) {
    throw badRequest('start_date tidak boleh lebih besar dari end_date', { code: 'date_range_invalid' });
  }

  const userIds = Array.isArray(user_ids) ? user_ids.map((id) => normalizeId(id, 'id_user')) : undefined;
  const rows = await listJadwalShiftKerja({ startDate, endDate, userIds });
  return rows.map((row) => serializeRow(row));
}

export async function upsertJadwalShiftKerjaService(assignments) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw badRequest('Assignments wajib diisi', { code: 'assignments_required' });
  }

  const normalized = assignments.map((item) => {
    const id_user = normalizeId(item?.id_user, 'id_user');
    const id_pola_kerja = item?.id_pola_kerja ? normalizeId(item.id_pola_kerja, 'id_pola_kerja') : null;
    const tanggal = normalizeDate(item?.tanggal, 'tanggal');
    return { id_user, id_pola_kerja, tanggal };
  });

  const toDelete = normalized.filter((item) => !item.id_pola_kerja);
  const toUpsert = normalized.filter((item) => item.id_pola_kerja);

  const results = await prisma.$transaction(async (tx) => {
    if (toDelete.length) {
      await Promise.all(toDelete.map((item) => deleteJadwalShiftKerja(item, tx)));
    }

    const upserted = await Promise.all(toUpsert.map((item) => upsertJadwalShiftKerja(item, tx)));
    return upserted;
  });

  return {
    upserted: results.map((row) => serializeRow(row)),
    deleted: toDelete.length,
  };
}
