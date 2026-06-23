import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '../generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare module 'fastify' {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb' });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

const databasePlugin: FastifyPluginAsync = async (fastify, options) => {
  try {
    // Membuka koneksi database
    await prisma.$connect();
    fastify.log.info('Database PostgreSQL connected via Prisma');

    // Menambahkan PrismaClient ke instance Fastify
    fastify.decorate('db', prisma);

    // Memastikan koneksi tertutup saat server dimatikan
    fastify.addHook('onClose', async (instance) => {
      await prisma.$disconnect();
    });
  } catch (error) {
    fastify.log.error(`Failed to connect to database via Prisma: ${error}`);
    throw error;
  }
};

export default fp(databasePlugin);
