// src/routes/api/v1/payment.route.ts
import { FastifyPluginAsync } from 'fastify';
import { paymentWebhook } from '../../../controllers/payment.controller';

const paymentRoutes: FastifyPluginAsync = async (fastify, options) => {
  fastify.post('/webhook', paymentWebhook.bind(fastify));
};

export default paymentRoutes;
