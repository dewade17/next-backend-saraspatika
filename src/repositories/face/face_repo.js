import { prisma } from '@/lib/db.js';

export async function listUserFaces() {
  return await prisma.userFace.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      user: {
        select: {
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
        },
      },
    },
  });
}
