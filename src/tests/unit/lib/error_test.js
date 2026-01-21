import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { normalizeToAppError, errorResponse, badRequest } from '@/lib/error.js';

describe('lib/error', () => {
  it('normalizeToAppError: ZodError -> 400 validation_error', () => {
    let err;
    try {
      z.object({ email: z.string().email() }).parse({ email: 'x' });
    } catch (e) {
      err = e;
    }

    const ae = normalizeToAppError(err);
    expect(ae.status).toBe(400);
    expect(ae.code).toBe('validation_error');
    expect(ae.expose).toBe(true);
    expect(Array.isArray(ae.errors)).toBe(true);
  });

  it('normalizeToAppError: invalid JSON SyntaxError -> 400 invalid_json', () => {
    const se = new SyntaxError('Unexpected token } in JSON');
    const ae = normalizeToAppError(se);

    expect(ae.status).toBe(400);
    expect(ae.code).toBe('invalid_json');
  });

  it('normalizeToAppError: JWTExpired -> 401 token_expired', () => {
    const e = Object.assign(new Error('expired'), { name: 'JWTExpired' });
    const ae = normalizeToAppError(e);

    expect(ae.status).toBe(401);
    expect(ae.code).toBe('token_expired');
  });

  it('errorResponse: returns Response json with status', async () => {
    const res = errorResponse(badRequest('X', { code: 'x' }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toMatchObject({ status: 400, code: 'x', detail: 'X' });
  });
});
