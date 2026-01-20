import { NextResponse } from 'next/server';
import { apiRoute, parseBody } from '@/lib/api.js';
import { setAuthCookie } from '@/lib/cookie.js';
import { registerValidation } from '@/validations/auth/auth_validation.js';
import { register } from '@/services/auth/auth_service.js';

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, registerValidation);
  const result = await register(input);

  if (result.token) await setAuthCookie(result.token);

  return NextResponse.json({
    ok: true,
    id_user: result.user.id_user,
    role_assigned: result.role_assigned,
  });
});
