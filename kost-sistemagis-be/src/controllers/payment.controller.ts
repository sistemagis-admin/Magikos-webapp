// src/controllers/payment.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';
import { env } from '../config/env';
import { RfidService } from '../services/rfid.service';
import crypto from 'crypto';

interface PaymentWebhookPayload {
  paymentId: string;
  status: string;
  amount?: number;
  paymentMethod?: string;
  transactionId?: string;
}

export async function paymentWebhook(
  this: import('fastify').FastifyInstance,
  req: FastifyRequest<{ Body: PaymentWebhookPayload }>,
  reply: FastifyReply
) {
  // 1. Verifikasi Keaslian Webhook (Signature / Secret Verification)
  const webhookSecretHeader = req.headers['x-webhook-secret'] as string | undefined;
  const webhookSignatureHeader = req.headers['x-webhook-signature'] as string | undefined;

  let isVerified = false;

  if (webhookSecretHeader && webhookSecretHeader === env.PAYMENT_WEBHOOK_SECRET) {
    isVerified = true;
  } else if (webhookSignatureHeader) {
    try {
      const rawBody = JSON.stringify(req.body || {});
      const expectedSignature = crypto
        .createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      if (
        Buffer.byteLength(webhookSignatureHeader) === Buffer.byteLength(expectedSignature) &&
        crypto.timingSafeEqual(Buffer.from(webhookSignatureHeader), Buffer.from(expectedSignature))
      ) {
        isVerified = true;
      }
    } catch {
      isVerified = false;
    }
  }

  if (!isVerified) {
    this.log.warn('Unauthorized payment webhook attempt detected');
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED_WEBHOOK',
        message: 'Invalid or missing webhook signature/secret.'
      }
    });
  }

  const { paymentId, status, paymentMethod } = req.body || {};

  if (!paymentId || !status) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Missing required paymentId or status in webhook payload.'
      }
    });
  }

  this.log.info(`Payment webhook verified for Payment ID ${paymentId} with status ${status}`);

  // 2. Cari data pembayaran di database
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { resident: true, room: true, kost: true }
  });

  if (!payment) {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'PAYMENT_NOT_FOUND',
        message: `Payment record with ID ${paymentId} was not found.`
      }
    });
  }

  // 3. Update status pembayaran di database
  const normalizedStatus = status.toUpperCase() === 'SUCCESS' ? 'PAID' : status.toUpperCase();
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: normalizedStatus,
      paymentMethod: paymentMethod || payment.paymentMethod
    }
  });

  // 4. Jika pembayaran berhasil (PAID), catat alert dan operasikan IoT jika diizinkan
  if (normalizedStatus === 'PAID') {
    await prisma.systemAlert.create({
      data: {
        kostId: payment.kostId,
        type: 'INFO',
        message: `Pembayaran ${payment.type} kamar ${payment.room?.number || ''} (${payment.resident?.name || ''}) sebesar Rp ${payment.amount.toLocaleString('id-ID')} telah lunas diverifikasi.`
      }
    });

    if (this.mqtt) {
      try {
        const rfidService = new RfidService(this);
        await rfidService.openMainDoor(`PAYMENT_${payment.residentId}`);
      } catch (err) {
        this.log.error(err, 'Failed to trigger IoT door access on payment success');
      }
    }
  }

  return reply.send({
    success: true,
    data: {
      paymentId: updatedPayment.id,
      status: updatedPayment.status,
      amount: updatedPayment.amount
    }
  });
}

