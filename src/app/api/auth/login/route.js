import { NextResponse } from 'next/server';
import { apiRoute, parseBody } from '@/lib/api.js';
import { setAuthCookie } from '@/lib/cookie.js';
import { loginValidation } from '@/validations/auth/auth_validation.js';
import { login } from '@/services/auth/auth_service.js';

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, loginValidation);
  const { rememberMe, ...credentials } = input;
  const { token } = await login(credentials);

  await setAuthCookie(token, { rememberMe });

  return NextResponse.json({ ok: true, token });
});
