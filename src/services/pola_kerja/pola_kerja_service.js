import { badRequest, conflict } from '@/lib/error.js';
import { createPolaKerja, deletePolaKerja, findPolaKerjaById, findPolaKerjaByName, listPolaKerja, updatePolaKerja } from '@/repositories/pola_kerja/pola_kerja_repo.js';

const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;

function normalizeName(nama_pola_kerja) {
  return String(nama_pola_kerja || '').trim();
}

function toTimeDate(value) {
  if (value == null) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (timePattern.test(trimmed)) {
      const [hh, mm, ss = '0'] = trimmed.split(':');
      const hour = Number.parseInt(hh, 10);
      const minute = Number.parseInt(mm, 10);
      const second = Number.parseInt(ss, 10);
      if ([hour, minute, second].some((n) => Number.isNaN(n))) return null;
      return new Date(Date.UTC(1970, 0, 1, hour, minute, second));
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function formatTimeValue(value) {
  if (value == null) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(11, 16);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (timePattern.test(trimmed)) return trimmed.slice(0, 5);
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(11, 16);
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(11, 16);
  }

  return null;
}

function serializePolaKerja(data) {
  if (!data) return data;
  return {
    ...data,
    jam_mulai_kerja: formatTimeValue(data.jam_mulai_kerja),
    jam_selesai_kerja: formatTimeValue(data.jam_selesai_kerja),
  };
}

export async function listPolaKerjaService() {
  const rows = await listPolaKerja();
  return Array.isArray(rows) ? rows.map((row) => serializePolaKerja(row)) : [];
}

export async function getPolaKerjaByIdService(id_pola_kerja) {
  const id = String(id_pola_kerja || '').trim();
  if (!id) throw badRequest('ID pola kerja tidak valid', { code: 'id_pola_kerja_invalid' });

  const data = await findPolaKerjaById(id);
  if (!data) throw badRequest('Pola kerja tidak ditemukan', { code: 'pola_kerja_not_found', status: 404 });
  return serializePolaKerja(data);
}

export async function createPolaKerjaService(input) {
  const nama_pola_kerja = normalizeName(input?.nama_pola_kerja);
  if (!nama_pola_kerja) throw badRequest('Nama pola kerja wajib diisi', { code: 'nama_pola_kerja_required' });

  const jam_mulai_kerja = toTimeDate(input?.jam_mulai_kerja);
  if (!jam_mulai_kerja) throw badRequest('Jam mulai kerja wajib diisi', { code: 'jam_mulai_kerja_required' });

  const jam_selesai_kerja = toTimeDate(input?.jam_selesai_kerja);
  if (!jam_selesai_kerja) throw badRequest('Jam selesai kerja wajib diisi', { code: 'jam_selesai_kerja_required' });

  const existing = await findPolaKerjaByName(nama_pola_kerja);
  if (existing) {
    throw conflict('Nama pola kerja sudah ada', {
      code: 'nama_pola_kerja_duplicate',
      errors: { nama_pola_kerja },
    });
  }

  const created = await createPolaKerja({
    nama_pola_kerja,
    jam_mulai_kerja,
    jam_selesai_kerja,
  });
  return serializePolaKerja(created);
}

export async function updatePolaKerjaService(id_pola_kerja, input) {
  const id = String(id_pola_kerja || '').trim();
  if (!id) throw badRequest('ID pola kerja tidak valid', { code: 'id_pola_kerja_invalid' });

  const data = {};

  if (input?.nama_pola_kerja !== undefined) {
    data.nama_pola_kerja = normalizeName(input?.nama_pola_kerja);
  }

  if (input?.jam_mulai_kerja !== undefined) {
    data.jam_mulai_kerja = toTimeDate(input?.jam_mulai_kerja);
  }

  if (input?.jam_selesai_kerja !== undefined) {
    data.jam_selesai_kerja = toTimeDate(input?.jam_selesai_kerja);
  }

  if (Object.keys(data).length === 0) {
    throw badRequest('Tidak ada data untuk diperbarui', { code: 'pola_kerja_no_changes' });
  }

  if (data.nama_pola_kerja) {
    const existing = await findPolaKerjaByName(data.nama_pola_kerja);
    if (existing && existing.id_pola_kerja !== id) {
      throw conflict('Nama pola kerja sudah ada', {
        code: 'nama_pola_kerja_duplicate',
        errors: { nama_pola_kerja: data.nama_pola_kerja },
      });
    }
  }

  const updated = await updatePolaKerja(id, data);
  return serializePolaKerja(updated);
}

export async function deletePolaKerjaService(id_pola_kerja) {
  const id = String(id_pola_kerja || '').trim();
  if (!id) throw badRequest('ID pola kerja tidak valid', { code: 'id_pola_kerja_invalid' });

  return await deletePolaKerja(id);
}
