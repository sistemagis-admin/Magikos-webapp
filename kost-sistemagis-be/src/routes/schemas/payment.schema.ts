// src/routes/schemas/payment.schema.ts
import { standardErrorResponses } from './common.schema';

export const paymentWebhookSchema = {
  tags: ['Payment'],
  summary: 'Payment Gateway Webhook Callback',
  description: 'Webhook endpoint called by payment gateway upon transaction status update. Authenticated via x-webhook-secret header or HMAC x-webhook-signature.',
  headers: {
    type: 'object',
    properties: {
      'x-webhook-secret': { type: 'string', description: 'Shared secret token for webhook verification' },
      'x-webhook-signature': { type: 'string', description: 'HMAC SHA256 hex signature' }
    }
  },
  body: {
    type: 'object',
    required: ['paymentId', 'status'],
    properties: {
      paymentId: { type: 'string', description: 'Payment record ID in KosMonitor' },
      status: { type: 'string', description: 'Payment status (e.g., PAID, PENDING, FAILED)' },
      amount: { type: 'number', description: 'Amount paid' },
      paymentMethod: { type: 'string', description: 'Payment method (e.g., TRANSFER, QRIS, CASH)' },
      transactionId: { type: 'string', description: 'External transaction ID from gateway' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            paymentId: { type: 'string' },
            status: { type: 'string' },
            amount: { type: 'number' }
          }
        }
      }
    },
    ...standardErrorResponses
  }
};
