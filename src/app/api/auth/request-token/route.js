import { NextResponse } from 'next/server';
import { apiRoute, parseBody } from '@/lib/api.js';
import { requestTokenValidation } from '@/validations/auth/auth_validation.js';
import { requestResetToken } from '@/services/auth/auth_service.js';

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, requestTokenValidation);
  await requestResetToken(input);
  return NextResponse.json({ ok: true });
});
