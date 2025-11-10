// src/app/api/auth/logout/route.js

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@lib/cookies.js';
export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
