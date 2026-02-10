import { prisma } from '@/lib/db.js';

const publicSelect = {
  id_absensi: true,
  id_user: true,
  waktu_masuk: true,
  waktu_pulang: true,

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
      foto_profil_url: true,
      role: true,
    },
  },

  lokasi_datang: {
    select: {
      id_lokasi: true,
      nama_lokasi: true,
      latitude: true,
      longitude: true,
      radius: true,
    },
  },

  lokasi_pulang: {
    select: {
      id_lokasi: true,
      nama_lokasi: true,
      latitude: true,
      longitude: true,
      radius: true,
    },
  },
};

export async function listAbsensi({ startAt, endAt, role, q, limit = 2000 }) {
  const where = {
    waktu_masuk: {
      gte: startAt ?? undefined,
      lte: endAt ?? undefined,
    },
  };

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
      OR: [{ name: { contains: qs, mode: 'insensitive' } }, { nip: { contains: qs, mode: 'insensitive' } }, { email: { contains: qs, mode: 'insensitive' } }],
    };

    if (where.user?.is) where.user.is = { ...where.user.is, ...userFilter };
    else where.user = { is: userFilter };
  }

  return await prisma.absensi.findMany({
    where,
    select: publicSelect,
    orderBy: [{ waktu_masuk: 'desc' }, { id_absensi: 'desc' }],
    take: Math.max(1, Math.min(Number(limit) || 2000, 5000)),
  });
}
