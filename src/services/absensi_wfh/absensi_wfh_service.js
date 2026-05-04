import dayjs from 'dayjs';
import { badRequest } from '@/lib/error.js';
import { formatToDbDate } from '@/lib/date_helper.js';
import { listAbsensiWfh } from '@/repositories/absensi_wfh/absensi_wfh_repo.js';

const ALLOWED_ROLES = new Set(['GURU', 'PEGAWAI', 'ADMIN', 'KEPALA_SEKOLAH']);

function normalizeRole(role) {
  if (role == null || role === '') return null;
  const r = String(role).trim().toUpperCase();
  if (!r) return null;
  if (!ALLOWED_ROLES.has(r)) throw badRequest('role tidak valid', { code: 'role_invalid' });
  return r;
}

function normalizeDateOrNull(value) {
  if (value == null || value === '') return null;
  const d = formatToDbDate(value);
  if (!d) throw badRequest('tanggal tidak valid', { code: 'date_invalid' });
  return d;
}

function toNumberOrNull(v) {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  try {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function serialize(row) {
  if (!row) return row;

  const tanggal = dayjs(row.waktu_masuk).isValid() ? dayjs(row.waktu_masuk).format('YYYY-MM-DD') : null;

  return {
    id_absensi_wfh: row.id_absensi_wfh,
    id_user: row.id_user,
    correlation_id: row.correlation_id ?? null,
    tanggal,

    waktu_masuk: row.waktu_masuk ? row.waktu_masuk.toISOString() : null,
    waktu_pulang: row.waktu_pulang ? row.waktu_pulang.toISOString() : null,

    status_masuk: row.status_masuk ?? null,
    status_pulang: row.status_pulang ?? null,
    face_verified_masuk: row.face_verified_masuk,
    face_verified_pulang: row.face_verified_pulang,

    user: row.user
      ? {
          id_user: row.user.id_user,
          name: row.user.name ?? null,
          nip: row.user.nip ?? null,
          email: row.user.email ?? null,
          foto_profil_url: row.user.foto_profil_url ?? null,
          role: row.user.role ?? null,
        }
      : null,

    in: {
      latitude: toNumberOrNull(row.in_latitude),
      longitude: toNumberOrNull(row.in_longitude),
    },

    out: {
      latitude: toNumberOrNull(row.out_latitude),
      longitude: toNumberOrNull(row.out_longitude),
    },
  };
}

export async function listAbsensiWfhService({ start_date, end_date, role, q, id_user, limit } = {}) {
  const normalizedRole = normalizeRole(role);

  const start = normalizeDateOrNull(start_date);
  const end = normalizeDateOrNull(end_date);

  const endDate = end ?? dayjs().format('YYYY-MM-DD');
  const startDate = start ?? dayjs(endDate).subtract(6, 'day').format('YYYY-MM-DD');

  if (dayjs(startDate).isAfter(dayjs(endDate), 'day')) {
    throw badRequest('start_date tidak boleh lebih besar dari end_date', { code: 'date_range_invalid' });
  }

  const startAt = dayjs(startDate).startOf('day').toDate();
  const endAt = dayjs(endDate).endOf('day').toDate();

  const rows = await listAbsensiWfh({
    startAt,
    endAt,
    role: normalizedRole,
    q,
    limit,
    id_user,
  });

  return rows.map(serialize);
}
