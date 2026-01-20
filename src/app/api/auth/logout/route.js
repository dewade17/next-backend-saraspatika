import { NextResponse } from 'next/server';
import { apiRoute } from '@/lib/api.js';
import { clearAuthCookie } from '@/lib/cookie.js';

export const POST = apiRoute(async () => {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
});
