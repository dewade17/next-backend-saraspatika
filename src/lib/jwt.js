import { SignJWT, jwtVerify } from 'jose';
import { env } from './env.js';
import { prisma } from './db.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);
export const ACCESS_TOKEN_TTL = '20m';

export const issueAccessToken = (payload, ttl = ACCESS_TOKEN_TTL) => new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(ttl).sign(secret);

export async function verifyAccessToken(token) {
  const payload = (await jwtVerify(token, secret)).payload;
  const id_user = String(payload?.sub || '').trim();

  if (!id_user) return payload;

  const tokenSessionVersion = payload?.sessionVersion;
  if (tokenSessionVersion == null) {
    throw new Error('Token session tidak valid');
  }

  const user = await prisma.user.findUnique({
    where: { id_user },
    select: {
      session_version: true,
      device: { select: { device_id_hash: true } },
    },
  });

  if (!user) throw new Error('User token tidak ditemukan');

  if (Number(tokenSessionVersion) !== Number(user.session_version ?? 0)) {
    throw new Error('Sesi sudah tidak berlaku');
  }

  const tokenDeviceHash = String(payload?.deviceIdHash || '').trim();
  const storedDeviceHash = String(user.device?.device_id_hash || '').trim();

  if (tokenDeviceHash && storedDeviceHash && tokenDeviceHash !== storedDeviceHash) {
    throw new Error('Perangkat token tidak valid');
  }

  return payload;
}
