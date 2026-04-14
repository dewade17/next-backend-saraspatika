import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_AUTH_COOKIE_MAX_AGE, REMEMBER_ME_AUTH_COOKIE_MAX_AGE, setAuthCookie, clearAuthCookie } from '@/lib/cookie.js';
import { __resetCookies, __getLastSet } from 'next/headers';

describe('lib/cookie', () => {
  beforeEach(() => {
    __resetCookies();
  });

  it('setAuthCookie: sets access_token with expected options', async () => {
    await setAuthCookie('t');

    const last = __getLastSet();
    expect(last.name).toBe('access_token');
    expect(last.value).toBe('t');
    expect(last.opts).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: DEFAULT_AUTH_COOKIE_MAX_AGE,
    });
  });

  it('setAuthCookie: extends maxAge when rememberMe enabled', async () => {
    await setAuthCookie('t', { rememberMe: true });

    const last = __getLastSet();
    expect(last.name).toBe('access_token');
    expect(last.value).toBe('t');
    expect(last.opts).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: REMEMBER_ME_AUTH_COOKIE_MAX_AGE,
    });
  });

  it('clearAuthCookie: clears access_token', async () => {
    await clearAuthCookie();

    const last = __getLastSet();
    expect(last.name).toBe('access_token');
    expect(last.value).toBe('');
    expect(last.opts).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  });
});
