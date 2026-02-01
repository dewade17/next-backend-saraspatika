import { badRequest, conflict } from '@/lib/error.js';
import { createPolaKerja, deletePolaKerja, findPolaKerjaById, findPolaKerjaByName, listPolaKerja, updatePolaKerja } from '@/repositories/pola_kerja/pola_kerja_repo.js';
import { formatToTime, parseToDate } from '@/lib/time_helper.js';

function normalizeName(nama_pola_kerja) {
  return String(nama_pola_kerja || '').trim();
}

function toTimeDate(value) {
  return parseToDate(value);
}

function formatTimeValue(value) {
  if (value == null) return null;

  if (value instanceof Date) {
    return formatToTime(value);
  }

  if (typeof value === 'string') {
    const parsed = parseToDate(value);
    return parsed ? formatToTime(parsed) : null;
  }

  if (typeof value === 'number') {
    const parsed = parseToDate(value);
    return parsed ? formatToTime(parsed) : null;
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
