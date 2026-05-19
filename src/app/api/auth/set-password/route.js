import { NextResponse } from 'next/server';
import { apiRoute, parseBody } from '@/lib/api.js';
import { setPasswordValidation } from '@/validations/auth/auth_validation.js';
import { setPasswordWithToken } from '@/services/auth/auth_service.js';

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, setPasswordValidation);
  await setPasswordWithToken(input);

  return NextResponse.json({ ok: true });
});
