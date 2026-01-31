import { badRequest, conflict } from '@/lib/error.js';
import { createPolaKerja, deletePolaKerja, findPolaKerjaById, findPolaKerjaByName, listPolaKerja, updatePolaKerja } from '@/repositories/pola-kerja/pola_kerja_repo.js';

function normalizeName(nama_pola_kerja) {
  return String(nama_pola_kerja || '').trim();
}

function normalizeJam(jam) {
  return String(jam || '').trim();
}

export async function listPolaKerjaService() {
  return await listPolaKerja();
}

export async function getPolaKerjaByIdService(id_pola_kerja) {
  const id = String(id_pola_kerja || '').trim();
  if (!id) throw badRequest('ID pola kerja tidak valid', { code: 'id_pola_kerja_invalid' });

  const data = await findPolaKerjaById(id);
  if (!data) throw badRequest('Pola kerja tidak ditemukan', { code: 'pola_kerja_not_found', status: 404 });
  return data;
}

export async function createPolaKerjaService(input) {
  const nama_pola_kerja = normalizeName(input?.nama_pola_kerja);
  if (!nama_pola_kerja) throw badRequest('Nama pola kerja wajib diisi', { code: 'nama_pola_kerja_required' });

  const jam_mulai_kerja = normalizeJam(input?.jam_mulai_kerja);
  if (!jam_mulai_kerja) throw badRequest('Jam mulai kerja wajib diisi', { code: 'jam_mulai_kerja_required' });

  const jam_selesai_kerja = normalizeJam(input?.jam_selesai_kerja);
  if (!jam_selesai_kerja) throw badRequest('Jam selesai kerja wajib diisi', { code: 'jam_selesai_kerja_required' });

  const existing = await findPolaKerjaByName(nama_pola_kerja);
  if (existing) {
    throw conflict('Nama pola kerja sudah ada', {
      code: 'nama_pola_kerja_duplicate',
      errors: { nama_pola_kerja },
    });
  }

  return await createPolaKerja({
    nama_pola_kerja,
    jam_mulai_kerja,
    jam_selesai_kerja,
  });
}

export async function updatePolaKerjaService(id_pola_kerja, input) {
  const id = String(id_pola_kerja || '').trim();
  if (!id) throw badRequest('ID pola kerja tidak valid', { code: 'id_pola_kerja_invalid' });

  const data = {};

  if (input?.nama_pola_kerja !== undefined) {
    data.nama_pola_kerja = normalizeName(input?.nama_pola_kerja);
  }

  if (input?.jam_mulai_kerja !== undefined) {
    data.jam_mulai_kerja = normalizeJam(input?.jam_mulai_kerja);
  }

  if (input?.jam_selesai_kerja !== undefined) {
    data.jam_selesai_kerja = normalizeJam(input?.jam_selesai_kerja);
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

  return await updatePolaKerja(id, data);
}

export async function deletePolaKerjaService(id_pola_kerja) {
  const id = String(id_pola_kerja || '').trim();
  if (!id) throw badRequest('ID pola kerja tidak valid', { code: 'id_pola_kerja_invalid' });

  return await deletePolaKerja(id);
}
