import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRoute } from '@/lib/api.js';
import { unauthorized } from '@/lib/error.js';
import { verifyAccessToken } from '@/lib/jwt.js';
import { getPrivateUserData } from '@/services/auth/auth_service.js';

export const GET = apiRoute(async () => {
  const token = (await cookies()).get('access_token')?.value;
  if (!token) throw unauthorized('Unauthorized', { code: 'unauthorized' });

  const payload = await verifyAccessToken(token);
  const id_user = payload?.sub;
  if (!id_user) throw unauthorized('Unauthorized', { code: 'unauthorized' });

  const data = await getPrivateUserData(id_user);

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  });
});
