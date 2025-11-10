import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db.js';
import { hashPassword } from '@/lib/crypto.js';
import { issueAccessToken } from '@/lib/jwt.js';
import { setAuthCookie } from '@/lib/cookie.js';
import { getPermSet } from '@/lib/rbac.js';

const DEFAULT_ROLE = 'GURU';
const ALLOWED_SELF_ROLES = new Set(['GURU', 'PEGAWAI']); // self-register hanya boleh pilih ini

export async function POST(req) {
  try {
    const { name, email, password, role_name, autoLogin = true } = await req.json();

    // validasi sederhana
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    // cek duplikasi
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    // buat user
    const password_hash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name: name || null, password_hash },
    });

    // tentukan role (self-register tidak boleh KEPALA_SEKOLAH)
    const desired = String(role_name || '').toUpperCase();
    const roleToAssign = ALLOWED_SELF_ROLES.has(desired) ? desired : DEFAULT_ROLE;
    const role = await prisma.role.findUnique({ where: { name: roleToAssign } });
    if (role) {
      await prisma.userRole.upsert({
        where: { id_user_id_role: { id_user: user.id_user, id_role: role.id_role } },
        update: {},
        create: { id_user: user.id_user, id_role: role.id_role },
      });
    }

    // auto-login (optional)
    if (autoLogin) {
      const perms = Array.from(await getPermSet(user.id_user));
      const token = await issueAccessToken({ sub: user.id_user, email: user.email, perms }, '20m');
      await setAuthCookie(token);
    }

    return NextResponse.json({ ok: true, id_user: user.id_user, role_assigned: roleToAssign });
  } catch (e) {
    // Hindari bocor detail error
    return NextResponse.json({ error: 'Gagal mendaftar' }, { status: 500 });
  }
}
