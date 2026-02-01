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

export async function listLokasi() {
  return await prisma.lokasi.findMany({
    select: publicSelect,
    orderBy: { created_at: 'desc' },
  });
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
