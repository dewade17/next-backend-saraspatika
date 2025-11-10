import { SignJWT, jwtVerify } from 'jose';
import { env } from './env.js';
const secret = new TextEncoder().encode(env.JWT_SECRET);

export const issueAccessToken = (payload, ttl = '20m') => new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(ttl).sign(secret);

export const verifyAccessToken = async (token) => (await jwtVerify(token, secret)).payload;
