import { describe, it, expect, vi, beforeEach } from 'vitest';

const jwt = { verifyAccessToken: vi.fn() };
vi.mock('@/lib/jwt.js', () => jwt);

let middleware;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  ({ middleware } = await import('@/proxy.js'));
});

describe('middleware', () => {
  it('redirects to /login when no token', async () => {
    const req = {
      url: 'http://localhost/dashboard',
      cookies: { get: () => undefined },
    };

    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toBe('http://localhost/login');
  });

  it('passes when token valid', async () => {
    jwt.verifyAccessToken.mockResolvedValue({ sub: 'u1' });

    const req = {
      url: 'http://localhost/dashboard',
      cookies: { get: () => ({ value: 't' }) },
    };

    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('redirects to /login?expired=1 when token invalid', async () => {
    jwt.verifyAccessToken.mockRejectedValue(new Error('bad'));

    const req = {
      url: 'http://localhost/dashboard',
      cookies: { get: () => ({ value: 't' }) },
    };

    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toBe('http://localhost/login?expired=1');
  });
});
