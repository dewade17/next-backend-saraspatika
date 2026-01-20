import { NextResponse } from 'next/server';
import { apiRoute, parseBody } from '@/lib/api.js';
import { setAuthCookie } from '@/lib/cookie.js';
import { loginValidation } from '@/validations/auth/auth_validation.js';
import { login } from '@/services/auth/auth_service.js';

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, loginValidation);
  const { token } = await login(input);

  await setAuthCookie(token);

  return NextResponse.json({ ok: true, token });
});
