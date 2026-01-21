import { describe, it, expect, beforeEach } from 'vitest';
import { setAuthCookie, clearAuthCookie } from '@/lib/cookie.js';
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
      maxAge: 60 * 20,
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
