// src/app/api/auth/reset-password/route.js

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db.js';
import bcrypt from 'bcryptjs';
import { hashPassword } from '@/lib/crypto.js';

export async function POST(req) {
  const { email, code, newPassword } = await req.json();
  if (!email || !code || !newPassword) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { reset_tokens: true },
  });
  if (!user) return NextResponse.json({ ok: true });

  const token = user.reset_tokens.filter((t) => !t.consumed_at && t.expires_at > new Date()).sort((a, b) => b.expires_at - a.expires_at)[0];

  if (!token) return NextResponse.json({ error: 'Kode tidak valid' }, { status: 400 });
  const match = await bcrypt.compare(String(code), token.code_hash);
  if (!match) return NextResponse.json({ error: 'Kode tidak valid' }, { status: 400 });

  await prisma.$transaction([
    prisma.user.update({ where: { id_user: user.id_user }, data: { password_hash: await hashPassword(newPassword) } }),
    prisma.passwordResetToken.update({ where: { id_password_reset_token: token.id_password_reset_token }, data: { consumed_at: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
