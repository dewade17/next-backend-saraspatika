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

const SEARCHABLE_JENIS = new Set(['IZIN', 'SAKIT', 'CUTI']);
const SEARCHABLE_STATUS = new Set(['MENUNGGU', 'SETUJU', 'DITOLAK']);

function buildSearchWhere(q) {
  const s = String(q || '').trim();
  if (!s) return null;

  const normalized = s.toUpperCase();
  const or = [
    { alasan: { contains: s, mode: 'insensitive' } },
    { admin_note: { contains: s, mode: 'insensitive' } },
    {
      user: {
        is: {
          OR: [
            { name: { contains: s, mode: 'insensitive' } },
            { nip: { contains: s, mode: 'insensitive' } },
            { email: { contains: s, mode: 'insensitive' } },
          ],
        },
      },
    },
  ];

  if (SEARCHABLE_JENIS.has(normalized)) or.push({ jenis_pengajuan: normalized });
  if (SEARCHABLE_STATUS.has(normalized)) or.push({ status: normalized });
  if (normalized === 'DISETUJUI') or.push({ status: 'SETUJU' });

  return { OR: or };
}

export async function listPengajuanAbsensi({ id_user, jenis_pengajuan, status, q, startAt, endAt, page, limit } = {}) {
  const where = {};

  if (id_user) where.id_user = id_user;
  if (jenis_pengajuan) where.jenis_pengajuan = jenis_pengajuan;
  if (status) where.status = status;

  const rangeFilters = [];
  if (endAt) rangeFilters.push({ tanggal_mulai: { lte: endAt } });
  if (startAt) rangeFilters.push({ tanggal_selesai: { gte: startAt } });
  if (rangeFilters.length) where.AND = rangeFilters;

  const searchWhere = buildSearchWhere(q);
  if (searchWhere) where.OR = searchWhere.OR;

  const hasPagination = Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;

  if (!hasPagination) {
    return await prisma.pengajuanAbsensi.findMany({
      where,
      select: publicSelect,
      orderBy: { created_at: 'desc' },
    });
  }

  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.pengajuanAbsensi.findMany({
      where,
      select: publicSelect,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pengajuanAbsensi.count({ where }),
  ]);

  return { data, total, page, limit };
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
