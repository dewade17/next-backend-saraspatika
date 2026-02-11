import { prisma } from '@/lib/db.js';

const userSelect = {
  id_user: true,
  email: true,
  name: true,
  role: true,
  nip: true,
  foto_profil_url: true,
};

const publicSelect = {
  id_pengajuan: true,
  id_user: true,
  jenis_pengajuan: true,
  tanggal_mulai: true,
  tanggal_selesai: true,
  alasan: true,
  foto_bukti_url: true,
  status: true,
  admin_note: true,
  id_admin: true,
  created_at: true,
  updated_at: true,
  user: { select: userSelect },
  admin: { select: userSelect },
};

export async function listPengajuanAbsensi({ id_user, jenis_pengajuan, status } = {}) {
  const where = {};

  if (id_user) where.id_user = id_user;
  if (jenis_pengajuan) where.jenis_pengajuan = jenis_pengajuan;
  if (status) where.status = status;

  return await prisma.pengajuanAbsensi.findMany({
    where,
    select: publicSelect,
    orderBy: { created_at: 'desc' },
  });
}

export async function findPengajuanAbsensiById(id_pengajuan) {
  return await prisma.pengajuanAbsensi.findUnique({
    where: { id_pengajuan },
    select: publicSelect,
  });
}

export async function createPengajuanAbsensi(data) {
  return await prisma.pengajuanAbsensi.create({
    data,
    select: publicSelect,
  });
}

export async function updatePengajuanAbsensi(id_pengajuan, data) {
  return await prisma.pengajuanAbsensi.update({
    where: { id_pengajuan },
    data,
    select: publicSelect,
  });
}

export async function deletePengajuanAbsensi(id_pengajuan) {
  return await prisma.pengajuanAbsensi.delete({
    where: { id_pengajuan },
    select: publicSelect,
  });
}
