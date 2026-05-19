import { prisma } from '@/lib/db.js';

const userSelect = {
  id_user: true,
  name: true,
  email: true,
  nip: true,
  nomor_handphone: true,
  foto_profil_url: true,
  role: true,
  status: true,
  created_at: true,
  updated_at: true,
};

const publicInclude = {
  user: {
    select: userSelect,
  },
};

function buildSearchWhere(q) {
  const s = String(q || '').trim();
  if (!s) return undefined;

  return {
    user: {
      is: {
        OR: [
          { name: { contains: s, mode: 'insensitive' } },
          { email: { contains: s, mode: 'insensitive' } },
          { nip: { contains: s, mode: 'insensitive' } },
          { nomor_handphone: { contains: s, mode: 'insensitive' } },
          { role: { contains: s, mode: 'insensitive' } },
          { status: { contains: s, mode: 'insensitive' } },
        ],
      },
    },
  };
}

export async function listUserFaces({ q, page, limit } = {}) {
  const where = buildSearchWhere(q);
  const hasPagination = Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;

  if (!hasPagination) {
    return await prisma.userFace.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: publicInclude,
    });
  }

  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.userFace.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: publicInclude,
      skip,
      take: limit,
    }),
    prisma.userFace.count({ where }),
  ]);

  return { data, total, page, limit };
}
