// src/routes/api/v1/payment.route.ts
import { FastifyPluginAsync } from 'fastify';
import { paymentWebhook } from '../../../controllers/payment.controller';
import { paymentWebhookSchema } from '../../schemas/payment.schema';

const paymentRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Webhook does not use requireAuth because it is invoked by payment gateways.
  // Security is enforced via x-webhook-secret / HMAC x-webhook-signature in the controller.
  fastify.post('/webhook', { schema: paymentWebhookSchema }, paymentWebhook.bind(fastify) as any);
};

export default paymentRoutes;

