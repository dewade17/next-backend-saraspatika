import { describe, it, expect, vi, afterEach } from 'vitest';
import { issueAccessToken, verifyAccessToken } from '@/lib/jwt.js';

describe('jwt', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('issueAccessToken + verifyAccessToken: roundtrip payload', async () => {
    const token = await issueAccessToken({ sub: 'u1', email: 'a@b.com', perms: ['x:y'] }, '20m');
    const payload = await verifyAccessToken(token);

    expect(payload.sub).toBe('u1');
    expect(payload.email).toBe('a@b.com');
    expect(payload.perms).toEqual(['x:y']);
  });

  it('verifyAccessToken: rejects tampered token', async () => {
    const token = await issueAccessToken({ sub: 'u1' }, '20m');
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');

    await expect(verifyAccessToken(tampered)).rejects.toMatchObject({
      name: expect.stringMatching(/invalid|signature|verification/i),
    });
  });

  it('verifyAccessToken: expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-21T00:00:00Z'));

    const token = await issueAccessToken({ sub: 'u1' }, '1s');

    vi.setSystemTime(new Date('2026-01-21T00:00:03Z'));

    await expect(verifyAccessToken(token)).rejects.toMatchObject({
      name: expect.stringMatching(/expired/i),
    });
  });
});
