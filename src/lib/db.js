import { PrismaClient } from '../generated/prisma';
const g = globalThis;
export const prisma = g.__db || new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.__db = prisma;
