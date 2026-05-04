import { prisma } from '@/lib/db.js';

const publicSelect = {
  id_absensi_wfh: true,
  id_user: true,
  correlation_id: true,
  waktu_masuk: true,
  waktu_pulang: true,
  face_verified_masuk: true,
  face_verified_pulang: true,
  status_masuk: true,
  status_pulang: true,
  in_latitude: true,
  in_longitude: true,
  out_latitude: true,
  out_longitude: true,
  user: {
    select: {
      id_user: true,
      name: true,
      nip: true,
      email: true,
      foto_profil_url: true,
      role: true,
    },
  },
};

export async function listAbsensiWfh({ startAt, endAt, role, q, id_user, limit = 2000 }) {
  const where = {
    waktu_masuk: {
      gte: startAt ?? undefined,
      lte: endAt ?? undefined,
    },
  };

  if (id_user) {
    where.id_user = id_user;
  }

  if (role) {
    where.user = {
      is: {
        role,
      },
    };
  }

  const qs = String(q || '').trim();
  if (qs) {
    const userFilter = {
      OR: [
        { name: { contains: qs, mode: 'insensitive' } },
        { nip: { contains: qs, mode: 'insensitive' } },
        { email: { contains: qs, mode: 'insensitive' } },
      ],
    };

    if (where.user?.is) where.user.is = { ...where.user.is, ...userFilter };
    else where.user = { is: userFilter };
  }

  return await prisma.absensiWfh.findMany({
    where,
    select: publicSelect,
    orderBy: [{ waktu_masuk: 'desc' }, { id_absensi_wfh: 'desc' }],
    take: Math.max(1, Math.min(Number(limit) || 2000, 5000)),
  });
}
