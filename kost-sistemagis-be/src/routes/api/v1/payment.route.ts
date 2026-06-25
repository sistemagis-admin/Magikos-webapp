// src/routes/api/v1/payment.route.ts
import { FastifyPluginAsync } from 'fastify';
import { paymentWebhook } from '../../../controllers/payment.controller';
import { requireAuth } from '../../../plugins/auth-guard';

const paymentRoutes: FastifyPluginAsync = async (fastify, options) => {
  fastify.post('/webhook', { preHandler: requireAuth }, paymentWebhook.bind(fastify) as any);
};

export default paymentRoutes;
