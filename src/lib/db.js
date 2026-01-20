import { PrismaClient } from '@prisma/client'; // Gunakan default import
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const g = globalThis;

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = g.__db || createPrismaClient();

if (process.env.NODE_ENV !== 'production') g.__db = prisma;
