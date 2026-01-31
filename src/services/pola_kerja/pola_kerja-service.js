import { badRequest, conflict } from '@/lib/error.js';
import { createPolaKerja, findPolaKerjaByName, listPolaKerja } from '@/repositories/pola-kerja/pola_kerja_repo.js';

function normalizeName(nama_pola_kerja) {
  return String(nama_pola_kerja || '').trim();
}

function normalizeJam(jam) {
  return String(jam || '').trim();
}

export async function listPolaKerjaService() {
  return await listPolaKerja();
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
