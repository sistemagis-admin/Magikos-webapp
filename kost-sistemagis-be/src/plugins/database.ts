import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '../generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

declare module 'fastify' {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

const adapter = new PrismaBetterSqlite3({ url: 'dev.db' });
export const prisma = new PrismaClient({ adapter });

const databasePlugin: FastifyPluginAsync = async (fastify, options) => {
  try {
    // Membuka koneksi database
    await prisma.$connect();
    fastify.log.info('Database SQLite connected via Prisma');

    // Menambahkan PrismaClient ke instance Fastify
    fastify.decorate('db', prisma);

    // Memastikan koneksi tertutup saat server dimatikan
    fastify.addHook('onClose', async (instance) => {
      await prisma.$disconnect();
    });
  } catch (error) {
    fastify.log.error(error as Error, 'Failed to connect to database via Prisma');
    throw error;
  }
};

export default fp(databasePlugin);
