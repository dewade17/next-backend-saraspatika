import { badRequest, conflict, notFound } from '@/lib/error.js';
import {
  createProfileSekolah,
  deleteProfileSekolah,
  findProfileSekolahById,
  findProfileSekolahByNpsn,
  listProfileSekolah,
  updateProfileSekolah,
} from '@/repositories/profile_sekolah/profile_sekolah_repo.js';

function normalizeId(id_profile) {
  const id = String(id_profile || '').trim();
  if (!id) throw badRequest('ID profile sekolah tidak valid', { code: 'id_profile_invalid' });
  return id;
}

function normalizeText(value, fieldName) {
  const text = String(value || '').trim();
  if (!text) throw badRequest(`${fieldName} wajib diisi`, { code: `${fieldName}_required` });
  return text;
}

function normalizeNpsn(value) {
  const npsn = String(value || '').trim();
  if (!/^\d{8}$/.test(npsn)) {
    throw badRequest('NPSN harus terdiri dari 8 digit', { code: 'npsn_invalid' });
  }
  return npsn;
}

function normalizeOptionalText(value) {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || null;
}

export async function listProfileSekolahService() {
  const rows = await listProfileSekolah();
  return Array.isArray(rows) ? rows : [];
}

export async function getProfileSekolahByIdService(id_profile) {
  const id = normalizeId(id_profile);
  const data = await findProfileSekolahById(id);
  if (!data) throw notFound('Profile sekolah tidak ditemukan', { code: 'profile_sekolah_not_found' });
  return data;
}

export async function createProfileSekolahService(input) {
  const nama_sekolah = normalizeText(input?.nama_sekolah, 'nama_sekolah');
  const alamat_sekolah = normalizeText(input?.alamat_sekolah, 'alamat_sekolah');
  const npsn = normalizeNpsn(input?.npsn);
  const no_telepon = normalizeOptionalText(input?.no_telepon) ?? null;

  const existing = await findProfileSekolahByNpsn(npsn);
  if (existing) {
    throw conflict('NPSN sudah terdaftar', {
      code: 'npsn_duplicate',
      errors: { npsn },
    });
  }

  return await createProfileSekolah({
    nama_sekolah,
    alamat_sekolah,
    npsn,
    no_telepon,
  });
}

export async function updateProfileSekolahService(id_profile, input) {
  const id = normalizeId(id_profile);
  const current = await findProfileSekolahById(id);
  if (!current) throw notFound('Profile sekolah tidak ditemukan', { code: 'profile_sekolah_not_found' });

  const data = {};

  if (input?.nama_sekolah !== undefined) {
    data.nama_sekolah = normalizeText(input?.nama_sekolah, 'nama_sekolah');
  }

  if (input?.alamat_sekolah !== undefined) {
    data.alamat_sekolah = normalizeText(input?.alamat_sekolah, 'alamat_sekolah');
  }

  if (input?.npsn !== undefined) {
    const nextNpsn = normalizeNpsn(input?.npsn);
    const existing = await findProfileSekolahByNpsn(nextNpsn);
    if (existing && existing.id_profile !== id) {
      throw conflict('NPSN sudah terdaftar', {
        code: 'npsn_duplicate',
        errors: { npsn: nextNpsn },
      });
    }
    data.npsn = nextNpsn;
  }

  if (input?.no_telepon !== undefined) {
    data.no_telepon = normalizeOptionalText(input?.no_telepon);
  }

  if (Object.keys(data).length === 0) {
    throw badRequest('Tidak ada data untuk diperbarui', { code: 'profile_sekolah_no_changes' });
  }

  return await updateProfileSekolah(id, data);
}

export async function deleteProfileSekolahService(id_profile) {
  const id = normalizeId(id_profile);
  const current = await findProfileSekolahById(id);
  if (!current) throw notFound('Profile sekolah tidak ditemukan', { code: 'profile_sekolah_not_found' });
  return await deleteProfileSekolah(id);
}
