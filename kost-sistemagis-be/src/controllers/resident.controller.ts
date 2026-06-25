import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getResidents = async (
  req: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; roomId?: string } }>,
  reply: FastifyReply
) => {
  try {
    const { page = '1', limit = '10', search, roomId } = req.query;

    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }
    if (roomId) {
      whereClause.roomId = roomId;
    }

    const [residents, total] = await Promise.all([
      prisma.resident.findMany({
        where: whereClause,
        include: {
          room: true
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.resident.count({ where: whereClause })
    ]);

    return reply.send({
      success: true,
      data: residents,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching residents');
    return reply.status(500).send({ success: false, message: 'Failed to fetch residents' });
  }
};

export const getResident = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const resident = await prisma.resident.findUnique({
      where: { id },
      include: {
        room: true
      }
    });

    if (!resident) {
      return reply.status(404).send({ success: false, message: 'Resident not found' });
    }

    return reply.send({ success: true, data: resident });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching resident');
    return reply.status(500).send({ success: false, message: 'Failed to fetch resident' });
  }
};

export const createResident = async (
  req: FastifyRequest<{ Body: { name: string; email: string; avatarUrl?: string; roomId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { name, email, avatarUrl, roomId } = req.body;

    if (!name || !email || !roomId) {
      return reply.status(400).send({ success: false, message: 'Name, email, and roomId are required' });
    }

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });
    if (!room) {
      return reply.status(404).send({ success: false, message: 'Assigned room not found' });
    }

    // Check email uniqueness
    const existingResident = await prisma.resident.findUnique({
      where: { email }
    });
    if (existingResident) {
      return reply.status(400).send({ success: false, message: `Resident with email ${email} already exists` });
    }

    // Transaction to create resident and set room status to OCCUPIED
    const resident = await prisma.$transaction(async (tx) => {
      const newResident = await tx.resident.create({
        data: {
          name,
          email,
          avatarUrl,
          roomId
        },
        include: {
          room: true
        }
      });

      await tx.room.update({
        where: { id: roomId },
        data: { status: 'OCCUPIED' }
      });

      return newResident;
    });

    return reply.status(201).send({ success: true, data: resident });
  } catch (error) {
    req.log.error(error as Error, 'Error creating resident');
    return reply.status(500).send({ success: false, message: 'Failed to create resident' });
  }
};

export const updateResident = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { name?: string; email?: string; avatarUrl?: string; roomId?: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { name, email, avatarUrl, roomId } = req.body;

    const resident = await prisma.resident.findUnique({
      where: { id }
    });

    if (!resident) {
      return reply.status(404).send({ success: false, message: 'Resident not found' });
    }

    // Verify email if changing
    if (email && email !== resident.email) {
      const emailTaken = await prisma.resident.findUnique({
        where: { email }
      });
      if (emailTaken) {
        return reply.status(400).send({ success: false, message: `Email ${email} is already taken` });
      }
    }

    // Verify room if changing
    if (roomId && roomId !== resident.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: roomId }
      });
      if (!room) {
        return reply.status(404).send({ success: false, message: 'New assigned room not found' });
      }
    }

    const updatedResident = await prisma.$transaction(async (tx) => {
      const oldRoomId = resident.roomId;

      const res = await tx.resident.update({
        where: { id },
        data: {
          name,
          email,
          avatarUrl,
          roomId
        },
        include: {
          room: true
        }
      });

      // If room changed, handle transitions
      if (roomId && roomId !== oldRoomId) {
        // 1. Mark new room occupied
        await tx.room.update({
          where: { id: roomId },
          data: { status: 'OCCUPIED' }
        });

        // 2. Check if old room has any residents left
        const residentsInOldRoom = await tx.resident.count({
          where: { roomId: oldRoomId }
        });

        if (residentsInOldRoom === 0) {
          await tx.room.update({
            where: { id: oldRoomId },
            data: { status: 'AVAILABLE' }
          });
        }
      }

      return res;
    });

    return reply.send({ success: true, data: updatedResident });
  } catch (error) {
    req.log.error(error as Error, 'Error updating resident');
    return reply.status(500).send({ success: false, message: 'Failed to update resident' });
  }
};

export const deleteResident = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;

    const resident = await prisma.resident.findUnique({
      where: { id },
      include: {
        payments: true
      }
    });

    if (!resident) {
      return reply.status(404).send({ success: false, message: 'Resident not found' });
    }

    if (resident.payments.length > 0) {
      return reply.status(400).send({
        success: false,
        message: 'Cannot delete resident with existing payment history records.'
      });
    }

    await prisma.$transaction(async (tx) => {
      const roomId = resident.roomId;

      // Delete the resident (rfidLogs will be setNull due to onDelete: SetNull in schema)
      await tx.resident.delete({
        where: { id }
      });

      // Check if room has any remaining residents
      const remainingResidents = await tx.resident.count({
        where: { roomId }
      });

      if (remainingResidents === 0) {
        await tx.room.update({
          where: { id: roomId },
          data: { status: 'AVAILABLE' }
        });
      }
    });

    return reply.send({ success: true, message: 'Resident deleted successfully' });
  } catch (error) {
    req.log.error(error as Error, 'Error deleting resident');
    return reply.status(500).send({ success: false, message: 'Failed to delete resident' });
  }
};
