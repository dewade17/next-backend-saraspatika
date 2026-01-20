import { NextResponse } from 'next/server';
import { apiRoute, parseBody } from '@/lib/api.js';
import { resetPasswordValidation } from '@/validations/auth/auth_validation.js';
import { resetPassword } from '@/services/auth/auth_service.js';

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, resetPasswordValidation);
  await resetPassword(input);
  return NextResponse.json({ ok: true });
});
