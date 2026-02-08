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

export async function listFaceResetRequests({ status, id_user } = {}) {
  const where = {};

  if (status) where.status = status;
  if (id_user) where.id_user = id_user;

  return await prisma.faceResetRequest.findMany({
    where,
    select: publicSelect,
    orderBy: { created_at: 'desc' },
  });
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
