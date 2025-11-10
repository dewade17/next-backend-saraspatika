// src/app/api/auth/login/route.js

import { NextResponse } from 'next/server';
import { prisma } from '@lib/db.js';
import { verifyPassword } from '@lib/crypto.js';
import { getPermSet } from '@lib/rbac.js';
import { issueAccessToken } from '@lib/jwt.js';
import { setAuthCookie } from '@lib/cookies.js';

export async function POST(req) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const perms = Array.from(await getPermSet(user.id_user));
  const token = await issueAccessToken({ sub: user.id_user, email: user.email, perms }, '20m');
  await setAuthCookie(token);
  return NextResponse.json({ ok: true });
}
