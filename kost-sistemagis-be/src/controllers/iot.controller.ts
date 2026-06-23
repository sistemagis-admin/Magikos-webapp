// src/controllers/iot.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { RfidService } from '../services/rfid.service';

interface IotPayload {
  rfidTag?: string;
}

export async function manualOpenDoor(
  this: import('fastify').FastifyInstance,
  req: FastifyRequest<{ Body: IotPayload }>,
  reply: FastifyReply
) {
  const rfidTag = req.body?.rfidTag || 'TEST_MANUAL';
  const rfidService = new RfidService(this);

  try {
    const result = await rfidService.openMainDoor(rfidTag);
    return reply.send(result);
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return reply.status(500).send({ error: errMessage });
  }
}
