import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getRooms = async (
  req: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; status?: string } }>,
  reply: FastifyReply
) => {
  try {
    const { page = '1', limit = '10', search, status } = req.query;

    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (search) {
      whereClause.number = { contains: search };
    }
    if (status) {
      whereClause.status = status;
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where: whereClause,
        include: {
          residents: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { number: 'asc' }
      }),
      prisma.room.count({ where: whereClause })
    ]);

    return reply.send({
      success: true,
      data: rooms,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching rooms');
    return reply.status(500).send({ success: false, message: 'Failed to fetch rooms' });
  }
};

export const getRoom = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        residents: true
      }
    });

    if (!room) {
      return reply.status(404).send({ success: false, message: 'Room not found' });
    }

    return reply.send({ success: true, data: room });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching room');
    return reply.status(500).send({ success: false, message: 'Failed to fetch room' });
  }
};

export const createRoom = async (
  req: FastifyRequest<{ Body: { number: string; status?: string; monthlyPrice: number } }>,
  reply: FastifyReply
) => {
  try {
    const { number, status = 'AVAILABLE', monthlyPrice } = req.body;

    if (!number) {
      return reply.status(400).send({ success: false, message: 'Room number is required' });
    }
    if (monthlyPrice === undefined || monthlyPrice === null) {
      return reply.status(400).send({ success: false, message: 'Monthly price is required' });
    }

    // Check if room number already exists
    const existingRoom = await prisma.room.findUnique({
      where: { number }
    });

    if (existingRoom) {
      return reply.status(400).send({ success: false, message: `Room with number ${number} already exists` });
    }

    const room = await prisma.room.create({
      data: {
        number,
        status,
        monthlyPrice: parseFloat(monthlyPrice as any)
      }
    });

    return reply.status(201).send({ success: true, data: room });
  } catch (error) {
    req.log.error(error as Error, 'Error creating room');
    return reply.status(500).send({ success: false, message: 'Failed to create room' });
  }
};

export const updateRoom = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { number?: string; status?: string; monthlyPrice?: number } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { number, status, monthlyPrice } = req.body;

    const existingRoom = await prisma.room.findUnique({
      where: { id }
    });

    if (!existingRoom) {
      return reply.status(404).send({ success: false, message: 'Room not found' });
    }

    // If changing room number, check uniqueness
    if (number && number !== existingRoom.number) {
      const roomNumberTaken = await prisma.room.findUnique({
        where: { number }
      });
      if (roomNumberTaken) {
        return reply.status(400).send({ success: false, message: `Room with number ${number} already exists` });
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        number,
        status,
        monthlyPrice: monthlyPrice !== undefined ? parseFloat(monthlyPrice as any) : undefined
      }
    });

    return reply.send({ success: true, data: updatedRoom });
  } catch (error) {
    req.log.error(error as Error, 'Error updating room');
    return reply.status(500).send({ success: false, message: 'Failed to update room' });
  }
};

export const deleteRoom = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        residents: true,
        payments: true
      }
    });

    if (!room) {
      return reply.status(404).send({ success: false, message: 'Room not found' });
    }

    if (room.residents.length > 0) {
      return reply.status(400).send({
        success: false,
        message: 'Cannot delete room because it still has active residents.'
      });
    }

    if (room.payments.length > 0) {
      return reply.status(400).send({
        success: false,
        message: 'Cannot delete room because it has payment history records.'
      });
    }

    await prisma.room.delete({
      where: { id }
    });

    return reply.send({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    req.log.error(error as Error, 'Error deleting room');
    return reply.status(500).send({ success: false, message: 'Failed to delete room' });
  }
};
