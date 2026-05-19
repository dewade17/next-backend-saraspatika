import { prisma } from '@/lib/db.js';

const publicSelect = {
  id_lokasi: true,
  nama_lokasi: true,
  latitude: true,
  longitude: true,
  radius: true,
  created_at: true,
  updated_at: true,
};

function buildSearchWhere(q) {
  const s = String(q || '').trim();
  if (!s) return undefined;

  return {
    nama_lokasi: { contains: s, mode: 'insensitive' },
  };
}

export async function listLokasi({ q, page, limit } = {}) {
  const where = buildSearchWhere(q);
  const hasPagination = Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;

  if (!hasPagination) {
    return await prisma.lokasi.findMany({
      where,
      select: publicSelect,
      orderBy: { created_at: 'desc' },
    });
  }

  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.lokasi.findMany({
      where,
      select: publicSelect,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.lokasi.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function findLokasiById(id_lokasi) {
  return await prisma.lokasi.findUnique({
    where: { id_lokasi },
    select: publicSelect,
  });
}

export async function findLokasiByName(nama_lokasi) {
  return await prisma.lokasi.findUnique({
    where: { nama_lokasi },
    select: publicSelect,
  });
}

export async function createLokasi({ nama_lokasi, latitude, longitude, radius }) {
  return await prisma.lokasi.create({
    data: {
      nama_lokasi,
      latitude,
      longitude,
      radius,
    },
    select: publicSelect,
  });
}

export async function updateLokasi(id_lokasi, data) {
  return await prisma.lokasi.update({
    where: { id_lokasi },
    data,
    select: publicSelect,
  });
}

export async function deleteLokasi(id_lokasi) {
  return await prisma.lokasi.delete({
    where: { id_lokasi },
    select: publicSelect,
  });
}
