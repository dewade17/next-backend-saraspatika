import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db.js';
import { verifyAccessToken, issueAccessToken } from '@/lib/jwt.js';
const TTL = '10m';

export async function GET() {
  // Ambil access token login dari cookie
  const token = (await cookies()).get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verifikasi token login → ambil sub (id_user)
    const payload = await verifyAccessToken(token);
    const id_user = payload?.sub;
    if (!id_user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil data user terbaru dari DB
    const user = await prisma.user.findUnique({
      where: { id_user },
      select: { id_user: true, name: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buat JWT privat yang hanya berisi id_user, name, email
    const privatePayload = {
      id_user: user.id_user,
      name: user.name || '',
      email: user.email,
      purpose: 'private-data', // penanda opsional
    };
    const privateToken = await issueAccessToken(privatePayload, TTL);

    // Kembalikan token (jangan taruh di cookie; konsumsi di client / service lain)
    return NextResponse.json(
      {
        token: privateToken,
        expires_in_minutes: 10,
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
