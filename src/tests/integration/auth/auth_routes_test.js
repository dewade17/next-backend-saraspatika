import { describe, it, expect, vi, beforeEach } from 'vitest';
import { __resetCookies, __setCookie } from 'next/headers';

const cookieLib = { setAuthCookie: vi.fn(), clearAuthCookie: vi.fn() };
vi.mock('@/lib/cookie.js', () => cookieLib);

const authSvc = {
  login: vi.fn(),
  register: vi.fn(),
  requestResetToken: vi.fn(),
  resetPassword: vi.fn(),
  getPrivateUserData: vi.fn(),
};
vi.mock('@/services/auth/auth_service.js', () => authSvc);

const jwtLib = { verifyAccessToken: vi.fn() };
vi.mock('@/lib/jwt.js', () => jwtLib);

let loginRoute, registerRoute, logoutRoute, requestTokenRoute, resetPasswordRoute, getDataPrivateRoute;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  __resetCookies();

  loginRoute = await import('@/app/api/auth/login/route.js');
  registerRoute = await import('@/app/api/auth/register/route.js');
  logoutRoute = await import('@/app/api/auth/logout/route.js');
  requestTokenRoute = await import('@/app/api/auth/request-token/route.js');
  resetPasswordRoute = await import('@/app/api/auth/reset-password/route.js');
  getDataPrivateRoute = await import('@/app/api/auth/getdataprivate/route.js');
});

describe('auth routes', () => {
  it('POST /auth/login: ok, sets cookie', async () => {
    authSvc.login.mockResolvedValue({ token: 't1' });

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'x' }),
    });

    const res = await loginRoute.POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ ok: true, token: 't1' });
    expect(cookieLib.setAuthCookie).toHaveBeenCalledWith('t1');
  });

  it('POST /auth/login: validation error -> 400 problem json', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-email', password: 'x' }),
    });

    const res = await loginRoute.POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toMatchObject({
      status: 400,
      code: 'validation_error',
    });
  });

  it('POST /auth/register: ok, returns id_user + role_assigned; sets cookie when token exists', async () => {
    authSvc.register.mockResolvedValue({
      user: { id_user: 'u1' },
      role_assigned: 'GURU',
      token: 't2',
    });

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'N', email: 'a@b.com', password: '12345678' }),
    });

    const res = await registerRoute.POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ ok: true, id_user: 'u1', role_assigned: 'GURU' });
    expect(cookieLib.setAuthCookie).toHaveBeenCalledWith('t2');
  });

  it('POST /auth/register: ok, does NOT set cookie when token null', async () => {
    authSvc.register.mockResolvedValue({
      user: { id_user: 'u1' },
      role_assigned: 'GURU',
      token: null,
    });

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'N', email: 'a@b.com', password: '12345678', autoLogin: false }),
    });

    const res = await registerRoute.POST(req);
    expect(res.status).toBe(200);
    expect(cookieLib.setAuthCookie).not.toHaveBeenCalled();
  });

  it('POST /auth/logout: clears cookie', async () => {
    const req = new Request('http://localhost/api/auth/logout', { method: 'POST' });
    const res = await logoutRoute.POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(cookieLib.clearAuthCookie).toHaveBeenCalled();
  });

  it('POST /auth/request-token: ok', async () => {
    authSvc.requestResetToken.mockResolvedValue({ ok: true });

    const req = new Request('http://localhost/api/auth/request-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com' }),
    });

    const res = await requestTokenRoute.POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(authSvc.requestResetToken).toHaveBeenCalled();
  });

  it('POST /auth/reset-password: ok', async () => {
    authSvc.resetPassword.mockResolvedValue({ ok: true });

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', code: '123456', newPassword: '12345678' }),
    });

    const res = await resetPasswordRoute.POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(authSvc.resetPassword).toHaveBeenCalled();
  });

  it('GET /auth/getdataprivate: ok with token cookie, no-store header', async () => {
    __setCookie('access_token', 'jwt1');

    jwtLib.verifyAccessToken.mockResolvedValue({ sub: 'u1' });
    authSvc.getPrivateUserData.mockResolvedValue({
      id_user: 'u1',
      role: 'GURU',
      nama_pengguna: 'Nama',
      permissions: ['users:read'],
    });
    const res = await getDataPrivateRoute.GET(new Request('http://localhost/api/auth/getdataprivate'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ id_user: 'u1', role: 'GURU', nama_pengguna: 'Nama', permissions: ['users:read'] });
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('GET /auth/getdataprivate: 401 if no cookie', async () => {
    const res = await getDataPrivateRoute.GET(new Request('http://localhost/api/auth/getdataprivate'));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toMatchObject({ status: 401, code: 'unauthorized' });
  });
});
