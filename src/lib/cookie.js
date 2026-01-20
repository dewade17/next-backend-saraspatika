import { cookies } from 'next/headers';

const isProd = process.env.NODE_ENV === 'production';

export async function setAuthCookie(token) {
  (await cookies()).set('access_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 20,
  });
}

export async function clearAuthCookie() {
  (await cookies()).set('access_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
