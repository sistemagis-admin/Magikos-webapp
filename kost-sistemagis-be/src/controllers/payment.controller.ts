// src/controllers/payment.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { RfidService } from '../services/rfid.service';

interface PaymentPayload {
  status: string;
  rfidTag?: string;
  transactionId?: string;
}

export async function paymentWebhook(
  this: import('fastify').FastifyInstance,
  req: FastifyRequest<{ Body: PaymentPayload }>,
  reply: FastifyReply
) {
  const paymentData = req.body;
  this.log.info(`Payment webhook received: ${JSON.stringify(paymentData)}`);

  if (paymentData && paymentData.status === 'success') {
    const rfidService = new RfidService(this);
    try {
      const result = await rfidService.openMainDoor(paymentData.rfidTag || 'DEFAULT_TAG');
      return reply.send({ status: 'success', message: 'Payment processed', data: result });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ status: 'error', message: errMessage });
    }
  }

  return reply.send({ status: 'ignored', message: 'Payment status not success' });
}
