import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getResidents = async (
  req: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; roomId?: string; kostId?: string } }>,
  reply: FastifyReply
) => {
  try {
    const { page = '1', limit = '10', search, roomId, kostId } = req.query;

    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const parsedLimit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const limitNum = Math.min(parsedLimit, 100);
    const skip = (pageNum - 1) * limitNum;

    const user = req.session?.user;
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
    throw error;
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
      return reply.status(404).send({
        success: false,
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'The requested resident could not be found.'
        }
      });
    }

    return reply.send({ success: true, data: resident });
  } catch (error) {
    throw error;
  }
};

interface ResidentBody {
  name: string;
  email?: string;
  phone?: string;
  nik?: string;
  gender?: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  identityAddress?: string;
  occupation?: string;
  institution?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  ktpUrl?: string;
  avatarUrl?: string;
  roomId?: string;
  userId?: string;
  kostId: string;
}

export const createResident = async (
  req: FastifyRequest<{ Body: ResidentBody }>,
  reply: FastifyReply
) => {
  try {
    const data = req.body;

    // Check if room exists if roomId is provided and belongs to the given kost
    if (data.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: data.roomId }
      });
      if (!room) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: 'The assigned room could not be found.'
          }
        });
      }
      if (room.kostId !== data.kostId) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ROOM_KOST_MISMATCH',
            message: 'The specified room does not belong to the selected kost building.'
          }
        });
      }
    }

    // Check email uniqueness
    if (data.email) {
      const existingEmail = await prisma.resident.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_TAKEN',
            message: `A resident with the email ${data.email} already exists.`
          }
        });
      }
    }

    // Transaction to create resident and set room status to OCCUPIED
    const resident = await prisma.$transaction(async (tx) => {
      const newResident = await tx.resident.create({
        data,
        include: {
          room: true
        }
      });

      if (data.roomId) {
        await tx.room.update({
          where: { id: data.roomId },
          data: { status: 'OCCUPIED' }
        });
      }

      return newResident;
    });

    return reply.status(201).send({ success: true, data: resident });
  } catch (error) {
    throw error;
  }
};

export const updateResident = async (
  req: FastifyRequest<{ Params: { id: string }; Body: Partial<ResidentBody> }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const resident = await prisma.resident.findUnique({
      where: { id }
    });

    if (!resident) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'The requested resident could not be found.'
        }
      });
    }

    // Verify email if changing
    if (data.email && data.email !== resident.email) {
      const emailTaken = await prisma.resident.findUnique({
        where: { email: data.email }
      });
      if (emailTaken) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_TAKEN',
            message: `The email ${data.email} is already taken by another resident.`
          }
        });
      }
    }

    // Verify room if changing
    const targetKostId = data.kostId || resident.kostId;
    if (data.roomId && data.roomId !== resident.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: data.roomId }
      });
      if (!room) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: 'The new assigned room could not be found.'
          }
        });
      }
      if (room.kostId !== targetKostId) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ROOM_KOST_MISMATCH',
            message: 'The new assigned room does not belong to the resident\'s kost building.'
          }
        });
      }
    }

    const updatedResident = await prisma.$transaction(async (tx) => {
      const oldRoomId = resident.roomId;

      const res = await tx.resident.update({
        where: { id },
        data,
        include: {
          room: true
        }
      });

      // If room changed, handle transitions
      if (data.roomId && data.roomId !== oldRoomId) {
        // 1. Mark new room occupied
        await tx.room.update({
          where: { id: data.roomId },
          data: { status: 'OCCUPIED' }
        });

        // 2. Check if old room has any residents left
        if (oldRoomId) {
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
      } else if (data.roomId === null && oldRoomId) {
        // if room is removed completely
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
    throw error;
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
      return reply.status(404).send({
        success: false,
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'The requested resident could not be found.'
        }
      });
    }

    if (resident.payments.length > 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'PAYMENT_HISTORY_PRESENT',
          message: 'Cannot delete resident with existing payment history records.'
        }
      });
    }

    await prisma.$transaction(async (tx) => {
      const roomId = resident.roomId;

      // Delete the resident (rfidLogs will be setNull due to onDelete: SetNull in schema)
      await tx.resident.delete({
        where: { id }
      });

      // Check if room has any remaining residents
      if (roomId) {
        const remainingResidents = await tx.resident.count({
          where: { roomId }
        });

        if (remainingResidents === 0) {
          await tx.room.update({
            where: { id: roomId },
            data: { status: 'AVAILABLE' }
          });
        }
      }
    });

    return reply.send({
      success: true,
      data: {
        message: 'Resident deleted successfully.'
      }
    });
  } catch (error) {
    throw error;
  }
};
