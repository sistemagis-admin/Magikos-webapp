import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getRooms = async (
  req: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; status?: string; kostId?: string } }>,
  reply: FastifyReply
) => {
  try {
    const { page = '1', limit = '10', search, status, kostId } = req.query;

    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const parsedLimit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const limitNum = Math.min(parsedLimit, 100);
    const skip = (pageNum - 1) * limitNum;

    const user = req.session?.user;
    const whereClause: any = {};
    if (search) {
      whereClause.number = { contains: search };
    }
    if (status) {
      whereClause.status = status;
    }
    if (kostId) {
      whereClause.kostId = kostId;
    }

    // Filter by ownership if the user is not an admin/SuperAdmin
    if (user && (user as any).role !== 'admin' && (user as any).role !== 'SuperAdmin') {
      whereClause.kost = {
        managers: {
          some: {
            userId: user.id
          }
        }
      };
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
    throw error;
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
      return reply.status(404).send({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'The requested room could not be found.'
        }
      });
    }

    return reply.send({ success: true, data: room });
  } catch (error) {
    throw error;
  }
};

export const createRoom = async (
  req: FastifyRequest<{ Body: { number: string; status?: string; monthlyPrice: number; kostId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { number, status = 'AVAILABLE', monthlyPrice, kostId } = req.body;

    // Check if room number already exists in this kost
    const existingRoom = await prisma.room.findUnique({
      where: { kostId_number: { kostId, number } }
    });

    if (existingRoom) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'ROOM_NUMBER_TAKEN',
          message: `Room with number ${number} already exists in this kost.`
        }
      });
    }

    const room = await prisma.room.create({
      data: {
        number,
        status,
        monthlyPrice: parseFloat(monthlyPrice as any),
        kostId
      }
    });

    return reply.status(201).send({ success: true, data: room });
  } catch (error) {
    throw error;
  }
};

export const updateRoom = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { number?: string; status?: string; monthlyPrice?: number; kostId?: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { number, status, monthlyPrice, kostId } = req.body;

    const existingRoom = await prisma.room.findUnique({
      where: { id }
    });

    if (!existingRoom) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'The requested room could not be found.'
        }
      });
    }

    // If changing room number or kostId, check uniqueness
    if ((number && number !== existingRoom.number) || (kostId && kostId !== existingRoom.kostId)) {
      const kostIdToUse = kostId || existingRoom.kostId;
      const numberToUse = number || existingRoom.number;
      const roomNumberTaken = await prisma.room.findUnique({
        where: { kostId_number: { kostId: kostIdToUse, number: numberToUse } }
      });
      if (roomNumberTaken) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ROOM_NUMBER_TAKEN',
            message: `Room with number ${numberToUse} already exists in this kost.`
          }
        });
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        number,
        status,
        monthlyPrice: monthlyPrice !== undefined ? parseFloat(monthlyPrice as any) : undefined,
        kostId
      }
    });

    return reply.send({ success: true, data: updatedRoom });
  } catch (error) {
    throw error;
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
      return reply.status(404).send({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'The requested room could not be found.'
        }
      });
    }

    if (room.residents.length > 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'ACTIVE_RESIDENTS_PRESENT',
          message: 'Cannot delete room because it still has active residents.'
        }
      });
    }

    if (room.payments.length > 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'PAYMENT_HISTORY_PRESENT',
          message: 'Cannot delete room because it has payment history records.'
        }
      });
    }

    await prisma.room.delete({
      where: { id }
    });

    return reply.send({
      success: true,
      data: {
        message: 'Room deleted successfully.'
      }
    });
  } catch (error) {
    throw error;
  }
};
