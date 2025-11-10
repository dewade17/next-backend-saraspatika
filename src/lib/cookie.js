import { cookies } from 'next/headers';
export async function setAuthCookie(token) {
  (await cookies()).set('access_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 20,
  });
}
export async function clearAuthCookie() {
  (await cookies()).set('access_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
