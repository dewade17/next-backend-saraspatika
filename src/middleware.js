import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt.js';

export const config = {
  matcher: [
    '/home/:path*', // Ini akan mencakup /home/dashboard, /home/manajemen-pengguna, dll.
  ],
};

export async function middleware(req) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));
  try {
    await verifyAccessToken(token);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login?expired=1', req.url));
  }
}
