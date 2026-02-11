import { formatToDbDate } from '@/lib/date_helper.js';
import { badRequest, forbidden, notFound } from '@/lib/error.js';
import { storage } from '@/lib/storage.js';
import { getUserById } from '@/repositories/users/user_repo.js';
import { createPengajuanAbsensi, deletePengajuanAbsensi, findPengajuanAbsensiById, listPengajuanAbsensi, updatePengajuanAbsensi } from '@/repositories/pengajuan/pengajuan_repo.js';

const ALLOWED_STATUS = new Set(['MENUNGGU', 'SETUJU', 'DITOLAK']);
const ALLOWED_JENIS = new Set(['IZIN', 'SAKIT', 'CUTI']);

function normalizeText(value) {
  const normalized = String(value ?? '').trim();
  return normalized ? normalized : null;
}

function normalizeStatus(value) {
  if (value == null) return undefined;
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) return undefined;
  if (!ALLOWED_STATUS.has(normalized)) {
    throw badRequest('Status pengajuan tidak valid', { code: 'status_invalid' });
  }
  return normalized;
}

function normalizeJenis(value) {
  if (value == null) return undefined;
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) return undefined;
  if (!ALLOWED_JENIS.has(normalized)) {
    throw badRequest('Jenis pengajuan tidak valid', { code: 'jenis_pengajuan_invalid' });
  }
  return normalized;
}

function normalizeDateUtc(value, fieldName) {
  const dbDate = formatToDbDate(value);
  if (!dbDate) {
    throw badRequest(`${fieldName} tidak valid`, { code: `${fieldName.toLowerCase()}_invalid` });
  }
  return new Date(`${dbDate}T00:00:00.000Z`);
}

async function uploadFotoBukti(file) {
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    return null;
  }

  const upload = await storage.upload({
    data: file,
    filename: file.name || 'bukti-pengajuan.png',
    folder: 'pengajuan_absensi_bukti',
  });

  const share = await storage.createPublicShare(upload.remotePath);
  return share?.url || upload.remotePath;
}

async function assertActor(actorId) {
  const id = String(actorId ?? '').trim();
  if (!id) throw badRequest('ID user tidak valid', { code: 'id_user_invalid' });

  const user = await getUserById(id);
  if (!user) throw notFound('User tidak ditemukan', { code: 'user_not_found' });

  const role = String(user.role || '').toUpperCase();
  return {
    id_user: user.id_user,
    isAdmin: role === 'ADMIN',
  };
}

function assertReadableByActor(actor, pengajuan) {
  if (actor.isAdmin) return;
  if (pengajuan.id_user !== actor.id_user) {
    throw forbidden('Anda tidak bisa mengakses pengajuan user lain', { code: 'forbidden_pengajuan_owner' });
  }
}

export async function listPengajuanAbsensiService({ actor_id_user, target_id_user, jenis_pengajuan, status } = {}) {
  const actor = await assertActor(actor_id_user);
  const requestedUserId = String(target_id_user ?? '').trim();

  const id_user = actor.isAdmin ? requestedUserId || undefined : actor.id_user;

  return await listPengajuanAbsensi({
    id_user,
    jenis_pengajuan: normalizeJenis(jenis_pengajuan),
    status: normalizeStatus(status),
  });
}

export async function getPengajuanAbsensiByIdService(id_pengajuan, actor_id_user) {
  const id = String(id_pengajuan ?? '').trim();
  if (!id) throw badRequest('ID pengajuan tidak valid', { code: 'id_pengajuan_invalid' });

  const actor = await assertActor(actor_id_user);
  const pengajuan = await findPengajuanAbsensiById(id);
  if (!pengajuan) throw notFound('Pengajuan tidak ditemukan', { code: 'pengajuan_not_found' });

  assertReadableByActor(actor, pengajuan);
  return pengajuan;
}

export async function createPengajuanAbsensiService({ actor_id_user, input, file }) {
  const actor = await assertActor(actor_id_user);

  const tanggalMulai = normalizeDateUtc(input.tanggal_mulai, 'tanggal_mulai');
  const tanggalSelesai = normalizeDateUtc(input.tanggal_selesai, 'tanggal_selesai');
  if (tanggalSelesai < tanggalMulai) {
    throw badRequest('tanggal_selesai tidak boleh lebih kecil dari tanggal_mulai', { code: 'invalid_date_range' });
  }

  const fotoBuktiUploadUrl = await uploadFotoBukti(file);

  return await createPengajuanAbsensi({
    id_user: actor.id_user,
    jenis_pengajuan: normalizeJenis(input.jenis_pengajuan),
    tanggal_mulai: tanggalMulai,
    tanggal_selesai: tanggalSelesai,
    alasan: normalizeText(input.alasan),
    foto_bukti_url: fotoBuktiUploadUrl || normalizeText(input.foto_bukti_url),
  });
}

export async function updateStatusPengajuanAbsensiService(id_pengajuan, input, actor_id_user) {
  const id = String(id_pengajuan ?? '').trim();
  if (!id) throw badRequest('ID pengajuan tidak valid', { code: 'id_pengajuan_invalid' });

  const actor = await assertActor(actor_id_user);
  if (!actor.isAdmin) {
    throw forbidden('Hanya admin yang dapat memproses pengajuan', { code: 'forbidden_update_pengajuan' });
  }

  const existing = await findPengajuanAbsensiById(id);
  if (!existing) throw notFound('Pengajuan tidak ditemukan', { code: 'pengajuan_not_found' });

  const data = {
    status: normalizeStatus(input.status),
    admin_note: input.admin_note === undefined ? undefined : normalizeText(input.admin_note),
    id_admin: actor.id_user,
  };

  return await updatePengajuanAbsensi(id, data);
}

export async function deletePengajuanAbsensiService(id_pengajuan, actor_id_user) {
  const id = String(id_pengajuan ?? '').trim();
  if (!id) throw badRequest('ID pengajuan tidak valid', { code: 'id_pengajuan_invalid' });

  const actor = await assertActor(actor_id_user);

  const existing = await findPengajuanAbsensiById(id);
  if (!existing) throw notFound('Pengajuan tidak ditemukan', { code: 'pengajuan_not_found' });

  if (!actor.isAdmin && existing.id_user !== actor.id_user) {
    throw forbidden('Anda tidak dapat menghapus pengajuan user lain', { code: 'forbidden_delete_pengajuan_owner' });
  }

  return await deletePengajuanAbsensi(id);
}
