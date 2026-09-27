// src/controllers/iot.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { RfidService } from '../services/rfid.service';
import { prisma } from '../plugins/database';

interface IotPayload {
  rfidTag?: string;
  kostId?: string;
}

export async function manualOpenDoor(
  this: import('fastify').FastifyInstance,
  req: FastifyRequest<{ Body: IotPayload }>,
  reply: FastifyReply
) {
  const user = req.session?.user;
  const rfidTag = req.body?.rfidTag || `MANUAL_${user?.name || 'ADMIN'}`;
  const kostId = req.body?.kostId;
  const rfidService = new RfidService(this);

  try {
    const result = await rfidService.openMainDoor(rfidTag);

    // Record audit alert
    await prisma.systemAlert.create({
      data: {
        kostId,
        type: 'INFO',
        message: `Pintu utama dibuka manual oleh ${user?.name || 'Administrator'} (Tag: ${rfidTag}).`
      }
    });

    return reply.send({
      success: true,
      data: {
        message: result.message,
        rfidTag,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    this.log.error(error as Error, 'Failed to trigger IoT door access');
    throw error;
  }
}

