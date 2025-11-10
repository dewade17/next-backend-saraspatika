// src/app/api/auth/request-token/route.js

import { NextResponse } from 'next/server';
import { prisma } from '@lib/db.js';
import { sixDigit } from '@lib/crypto.js';
import bcrypt from 'bcryptjs';
import { sendResetCode } from '@lib/mail.js';

export async function POST(req) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true }); // samarkan

  const code = sixDigit();
  const code_hash = await bcrypt.hash(code, 12);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { id_user: user.id_user, code_hash, expires_at },
  });
  await sendResetCode(email, code);
  return NextResponse.json({ ok: true });
}
