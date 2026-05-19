import { prisma } from '@/lib/db.js';

const userSelect = {
  id_user: true,
  email: true,
  name: true,
  status: true,
  nomor_handphone: true,
  nip: true,
  foto_profil_url: true,
  role: true,
  created_at: true,
  updated_at: true,
};

const publicSelect = {
  id_request: true,
  id_user: true,
  alasan: true,
  status: true,
  admin_note: true,
  id_admin: true,
  created_at: true,
  updated_at: true,
  user: { select: userSelect },
  admin: { select: userSelect },
};

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
            { email: { contains: s, mode: 'insensitive' } },
            { nip: { contains: s, mode: 'insensitive' } },
          ],
        },
      },
    },
  ];

  if (SEARCHABLE_STATUS.has(normalized)) or.push({ status: normalized });
  if (normalized === 'DISETUJUI') or.push({ status: 'SETUJU' });

  return { OR: or };
}

export async function listFaceResetRequests({ status, id_user, q, page, limit } = {}) {
  const where = {};

  if (status) where.status = status;
  if (id_user) where.id_user = id_user;

  const searchWhere = buildSearchWhere(q);
  if (searchWhere) where.OR = searchWhere.OR;

  const hasPagination = Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;

  if (!hasPagination) {
    return await prisma.faceResetRequest.findMany({
      where,
      select: publicSelect,
      orderBy: { created_at: 'desc' },
    });
  }

  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.faceResetRequest.findMany({
      where,
      select: publicSelect,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.faceResetRequest.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function findFaceResetRequestById(id_request) {
  return await prisma.faceResetRequest.findUnique({
    where: { id_request },
    select: publicSelect,
  });
}

export async function createFaceResetRequest({ id_user, alasan }) {
  return await prisma.faceResetRequest.create({
    data: {
      id_user,
      alasan,
    },
    select: publicSelect,
  });
}

export async function updateFaceResetRequest(id_request, data) {
  return await prisma.faceResetRequest.update({
    where: { id_request },
    data,
    select: publicSelect,
  });
}

export async function deleteFaceResetRequest(id_request) {
  return await prisma.faceResetRequest.delete({
    where: { id_request },
    select: publicSelect,
  });
}
