import { prisma } from '@/lib/db.js';

const publicSelect = {
  id_pola_kerja: true,
  nama_pola_kerja: true,
  jam_mulai_kerja: true,
  jam_selesai_kerja: true,
  created_at: true,
  updated_at: true,
};

export async function listPolaKerja() {
  return await prisma.polaJamKerja.findMany({
    select: publicSelect,
    orderBy: { created_at: 'desc' },
  });
}

export async function findPolaKerjaById(id_pola_kerja) {
  return await prisma.polaJamKerja.findUnique({
    where: { id_pola_kerja },
    select: publicSelect,
  });
}

export async function findPolaKerjaByName(nama_pola_kerja) {
  return await prisma.polaJamKerja.findUnique({
    where: { nama_pola_kerja },
    select: publicSelect,
  });
}

export async function createPolaKerja({ nama_pola_kerja, jam_mulai_kerja, jam_selesai_kerja }) {
  return await prisma.polaJamKerja.create({
    data: {
      nama_pola_kerja,
      jam_mulai_kerja,
      jam_selesai_kerja,
    },
    select: publicSelect,
  });
}

export async function updatePolaKerja(id_pola_kerja, data) {
  return await prisma.polaJamKerja.update({
    where: { id_pola_kerja },
    data,
    select: publicSelect,
  });
}

export async function deletePolaKerja(id_pola_kerja) {
  return await prisma.polaJamKerja.delete({
    where: { id_pola_kerja },
    select: publicSelect,
  });
}
