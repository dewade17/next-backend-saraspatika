import { badRequest, conflict } from '@/lib/error.js';
import { createLokasi, deleteLokasi, findLokasiById, findLokasiByName, listLokasi, updateLokasi } from '@/repositories/lokasi/lokasi_repo.js';

function normalizeName(nama_lokasi) {
  return String(nama_lokasi || '').trim();
}

function normalizeNumber(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function listLokasiService() {
  const rows = await listLokasi();
  return Array.isArray(rows) ? rows : [];
}

export async function getLokasiByIdService(id_lokasi) {
  const id = String(id_lokasi || '').trim();
  if (!id) throw badRequest('ID lokasi tidak valid', { code: 'id_lokasi_invalid' });

  const data = await findLokasiById(id);
  if (!data) throw badRequest('Lokasi tidak ditemukan', { code: 'lokasi_not_found', status: 404 });
  return data;
}

export async function createLokasiService(input) {
  const nama_lokasi = normalizeName(input?.nama_lokasi);
  if (!nama_lokasi) throw badRequest('Nama lokasi wajib diisi', { code: 'nama_lokasi_required' });

  const latitude = normalizeNumber(input?.latitude);
  if (latitude == null) throw badRequest('Latitude wajib diisi', { code: 'latitude_required' });

  const longitude = normalizeNumber(input?.longitude);
  if (longitude == null) throw badRequest('Longitude wajib diisi', { code: 'longitude_required' });

  const radius = normalizeNumber(input?.radius);
  if (radius == null) throw badRequest('Radius wajib diisi', { code: 'radius_required' });

  const existing = await findLokasiByName(nama_lokasi);
  if (existing) {
    throw conflict('Nama lokasi sudah ada', {
      code: 'nama_lokasi_duplicate',
      errors: { nama_lokasi },
    });
  }

  const created = await createLokasi({
    nama_lokasi,
    latitude,
    longitude,
    radius: Math.trunc(radius),
  });

  return created;
}

export async function updateLokasiService(id_lokasi, input) {
  const id = String(id_lokasi || '').trim();
  if (!id) throw badRequest('ID lokasi tidak valid', { code: 'id_lokasi_invalid' });

  const data = {};

  if (input?.nama_lokasi !== undefined) {
    data.nama_lokasi = normalizeName(input?.nama_lokasi);
  }

  if (input?.latitude !== undefined) {
    data.latitude = normalizeNumber(input?.latitude);
  }

  if (input?.longitude !== undefined) {
    data.longitude = normalizeNumber(input?.longitude);
  }

  if (input?.radius !== undefined) {
    const normalized = normalizeNumber(input?.radius);
    data.radius = normalized == null ? null : Math.trunc(normalized);
  }

  Object.keys(data).forEach((key) => {
    if (data[key] == null) delete data[key];
  });

  if (Object.keys(data).length === 0) {
    throw badRequest('Tidak ada data untuk diperbarui', { code: 'lokasi_no_changes' });
  }

  if (data.nama_lokasi) {
    const existing = await findLokasiByName(data.nama_lokasi);
    if (existing && existing.id_lokasi !== id) {
      throw conflict('Nama lokasi sudah ada', {
        code: 'nama_lokasi_duplicate',
        errors: { nama_lokasi: data.nama_lokasi },
      });
    }
  }

  const updated = await updateLokasi(id, data);
  return updated;
}

export async function deleteLokasiService(id_lokasi) {
  const id = String(id_lokasi || '').trim();
  if (!id) throw badRequest('ID lokasi tidak valid', { code: 'id_lokasi_invalid' });

  return await deleteLokasi(id);
}
