import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config'; // Ensure dotenv is loaded so process.env.DATABASE_URL is available

declare module 'fastify' {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "postgrespassword";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || "5432";
const dbName = process.env.DB_NAME || "sistemagis";

const connectionString = process.env.DATABASE_URL || `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;
const isRemoteDb = connectionString.includes('sslmode=require') || (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

const pool = new Pool({
  connectionString,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

const databasePlugin: FastifyPluginAsync = async (fastify, options) => {
  // Menambahkan PrismaClient ke instance Fastify (Prisma menghubungkan secara lazy)
  fastify.decorate('db', prisma);

  // Pada server konvensional, uji koneksi di awal
  if (!process.env.VERCEL) {
    try {
      await prisma.$connect();
      fastify.log.info('Database PostgreSQL connected via Prisma');
    } catch (error) {
      fastify.log.warn('Could not establish initial database connection, Prisma will reconnect lazily.');
    }
  }

  // Memastikan koneksi tertutup saat server dimatikan
  fastify.addHook('onClose', async (instance) => {
    await prisma.$disconnect();
  });
};

export default fp(databasePlugin);
