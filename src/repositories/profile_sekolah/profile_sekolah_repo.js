import { prisma } from '@/lib/db.js';

const profileSekolahSelect = {
  id_profile: true,
  nama_sekolah: true,
  no_telepon: true,
  alamat_sekolah: true,
  npsn: true,
  created_at: true,
  updated_at: true,
};

export async function listProfileSekolah() {
  return await prisma.profileSekolah.findMany({
    select: profileSekolahSelect,
    orderBy: { created_at: 'desc' },
  });
}

export async function findProfileSekolahById(id_profile) {
  return await prisma.profileSekolah.findUnique({
    where: { id_profile },
    select: profileSekolahSelect,
  });
}

export async function findProfileSekolahByNpsn(npsn) {
  return await prisma.profileSekolah.findUnique({
    where: { npsn },
    select: profileSekolahSelect,
  });
}

export async function createProfileSekolah(data) {
  return await prisma.profileSekolah.create({
    data,
    select: profileSekolahSelect,
  });
}

export async function updateProfileSekolah(id_profile, data) {
  return await prisma.profileSekolah.update({
    where: { id_profile },
    data,
    select: profileSekolahSelect,
  });
}

export async function deleteProfileSekolah(id_profile) {
  return await prisma.profileSekolah.delete({
    where: { id_profile },
    select: profileSekolahSelect,
  });
}
