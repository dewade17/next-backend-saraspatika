import { cookies } from 'next/headers';

const isProd = process.env.NODE_ENV === 'production';
export const DEFAULT_AUTH_COOKIE_MAX_AGE = 60 * 20;
export const REMEMBER_ME_AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function setAuthCookie(token, options = {}) {
  const rememberMe = options?.rememberMe === true;

  (await cookies()).set('access_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? REMEMBER_ME_AUTH_COOKIE_MAX_AGE : DEFAULT_AUTH_COOKIE_MAX_AGE,
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
