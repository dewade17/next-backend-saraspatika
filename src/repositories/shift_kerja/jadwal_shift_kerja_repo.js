import { prisma } from '@/lib/db.js';

const publicSelect = {
  id_jadwal_shift: true,
  id_user: true,
  id_pola_kerja: true,
  tanggal: true,
};

export async function listJadwalShiftKerja({ startDate, endDate, userIds }) {
  const where = {
    tanggal: {
      // Konversi string "YYYY-MM-DD" menjadi objek Date
      gte: startDate ? new Date(startDate) : undefined,
      lte: endDate ? new Date(endDate) : undefined,
    },
  };

  if (Array.isArray(userIds) && userIds.length) {
    where.id_user = { in: userIds };
  }

  return await prisma.jadwalShiftKerja.findMany({
    where,
    select: publicSelect,
    orderBy: [{ tanggal: 'asc' }, { id_user: 'asc' }],
  });
}

export async function upsertJadwalShiftKerja({ id_user, id_pola_kerja, tanggal }, db = prisma) {
  return await db.jadwalShiftKerja.upsert({
    where: {
      id_user_tanggal: { id_user, tanggal: new Date(tanggal) },
    },
    create: {
      id_user,
      id_pola_kerja,
      tanggal: new Date(tanggal),
    },
    update: {
      id_pola_kerja,
    },
    select: publicSelect,
  });
}

export async function deleteJadwalShiftKerja({ id_user, tanggal }, db = prisma) {
  return await db.jadwalShiftKerja.deleteMany({
    where: { id_user, tanggal: new Date(tanggal) },
  });
}
