import { prisma } from '@/lib/db.js';

const agendaSelect = {
  id_agenda: true,
  id_user: true,
  deskripsi: true,
  kategori_agenda: true,
  tanggal: true,
  jam_mulai: true,
  jam_selesai: true,
  bukti_pendukung_url: true,
  created_at: true,
  updated_at: true,
  user: {
    select: {
      name: true,
      foto_profil_url: true,
    },
  },
};

export async function create(data) {
  return await prisma.agenda.create({
    data,
    select: agendaSelect,
  });
}

export async function findMany({ kategori_agenda, id_user } = {}) {
  const where = {};
  if (id_user) where.id_user = id_user;
  if (kategori_agenda) where.kategori_agenda = kategori_agenda;

  return await prisma.agenda.findMany({
    where,
    select: agendaSelect,
    orderBy: [{ tanggal: 'desc' }, { jam_mulai: 'asc' }, { created_at: 'desc' }],
  });
}

export async function findById(id_agenda) {
  return await prisma.agenda.findUnique({
    where: { id_agenda },
    select: agendaSelect,
  });
}

export async function update(id_agenda, data) {
  return await prisma.agenda.update({
    where: { id_agenda },
    data,
    select: agendaSelect,
  });
}

export async function remove(id_agenda) {
  return await prisma.agenda.delete({
    where: { id_agenda },
    select: agendaSelect,
  });
}
