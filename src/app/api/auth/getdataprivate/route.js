import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api.js';
import { unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { getPrivateUserData } from '@/services/auth/auth_service.js';

export const GET = apiRoute(async (req) => {
  const authHeader = req.headers.get('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    token = (await cookies()).get('access_token')?.value;
  }

  if (!token) {
    throw unauthorized('Unauthorized', { code: 'unauthorized' });
  }

  try {
    const payload = await verifyAccessToken(token);
    const id_user = payload?.sub;

    if (!id_user) {
      throw unauthorized('Unauthorized', { code: 'unauthorized' });
    }

    const data = await getPrivateUserData(id_user);

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    throw unauthorized('Unauthorized', { code: 'unauthorized' });
  }
});
