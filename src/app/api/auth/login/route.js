import { NextResponse } from 'next/server';
import { apiRoute, parseBody } from '@/lib/api.js';
import { setAuthCookie } from '@/lib/cookie.js';
import { loginValidation } from '@/validations/auth/auth_validation.js';
import { login } from '@/services/auth/auth_service.js';

function getClientIp(req) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || undefined;

  return req.headers.get('x-real-ip') || undefined;
}

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, loginValidation);
  const { token } = await login(input, {
    ip: getClientIp(req),
    userAgent: req.headers.get('user-agent') || undefined,
  });

  await setAuthCookie(token);

  return NextResponse.json({ ok: true, token });
});
