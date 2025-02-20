import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaConfig = {
  log: [
    'query', 
    'info', 
    'warn', 
    'error'
  ] as const satisfies Prisma.LogLevel[],
  datasources: {
    db: {
      url: process.env.NODE_ENV === 'production' 
        ? process.env.POSTGRES_PRISMA_URL
        : process.env.DATABASE_URL
    },
  },
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 