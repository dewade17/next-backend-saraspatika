import { describe, it, expect } from 'vitest';
import { apiRoute, parseBody } from '@/lib/api.js';
import { z } from 'zod';

describe('lib/api', () => {
  it('parseBody: parses JSON + validates', async () => {
    const schema = z.object({ email: z.string().trim().email() });
    const req = new Request('http://localhost/x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '  a@b.com  ' }),
    });

    const v = await parseBody(req, schema);
    expect(v.email).toBe('a@b.com');
  });

  it('apiRoute: catches error and returns standardized error response', async () => {
    const handler = apiRoute(async () => {
      throw new Error('boom');
    });

    const res = await handler(new Request('http://localhost/x'));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toMatchObject({ status: 500, code: 'internal_error' });
  });

  it('apiRoute + parseBody: invalid JSON -> 400 invalid_json', async () => {
    const schema = z.object({ any: z.any() });
    const handler = apiRoute(async (req) => {
      await parseBody(req, schema);
      return new Response('ok');
    });

    const req = new Request('http://localhost/x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not json',
    });

    const res = await handler(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toMatchObject({ status: 400, code: 'invalid_json' });
  });
});
