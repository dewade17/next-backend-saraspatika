import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db.js';
import { verifyAccessToken } from '@/lib/jwt.js';

export async function GET() {
  const token = (await cookies()).get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await verifyAccessToken(token);
    const id_user = payload?.sub;
    if (!id_user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id_user },
      select: {
        id_user: true,
        name: true,
        email: true,
        role: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        expires_in_minutes: 10,
        id_user: user.id_user,
        role: user.role,
        nama_pengguna: user.name,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
