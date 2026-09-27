import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getKosts = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = req.session?.user;
    const whereClause: any = {};

    // If user is not an admin/SuperAdmin, scope the list to only show kosts they manage
    if (user && (user as any).role !== 'admin' && (user as any).role !== 'SuperAdmin') {
      whereClause.managers = {
        some: {
          userId: user.id
        }
      };
    }

    const kosts = await prisma.kost.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    return reply.send({ success: true, data: kosts });
  } catch (error) {
    throw error;
  }
};

export const getKost = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = req.params;
    const kost = await prisma.kost.findUnique({ where: { id } });
    if (!kost) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'KOST_NOT_FOUND',
          message: 'The requested kost could not be found.'
        }
      });
    }
    return reply.send({ success: true, data: kost });
  } catch (error) {
    throw error;
  }
};

interface KostBody {
  name: string;
  type: string;
  description?: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  contactName?: string;
  contactPhone?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  imageUrl?: string;
}

export const createKost = async (req: FastifyRequest<{ Body: KostBody }>, reply: FastifyReply) => {
  try {
    const user = req.session?.user;

    // Only Admin Sistemagis can create new kost buildings
    if (!user || ((user as any).role !== 'admin' && (user as any).role !== 'SuperAdmin')) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only Sistemagis administrators can create new kost buildings.'
        }
      });
    }

    const data = req.body;
    const newKost = await prisma.kost.create({ data });
    return reply.status(201).send({ success: true, data: newKost });
  } catch (error) {
    throw error;
  }
};

export const updateKost = async (req: FastifyRequest<{ Params: { id: string }; Body: Partial<KostBody> }>, reply: FastifyReply) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const existingKost = await prisma.kost.findUnique({ where: { id } });
    if (!existingKost) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'KOST_NOT_FOUND',
          message: 'The requested kost could not be found.'
        }
      });
    }
    const updatedKost = await prisma.kost.update({
      where: { id },
      data
    });
    return reply.send({ success: true, data: updatedKost });
  } catch (error) {
    throw error;
  }
};

export const deleteKost = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = req.params;
    const existingKost = await prisma.kost.findUnique({ where: { id } });
    if (!existingKost) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'KOST_NOT_FOUND',
          message: 'The requested kost could not be found.'
        }
      });
    }

    const [activeResidents, payments] = await Promise.all([
      prisma.resident.count({ where: { kostId: id } }),
      prisma.payment.count({ where: { kostId: id } })
    ]);

    if (activeResidents > 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'ACTIVE_RESIDENTS_PRESENT',
          message: 'Cannot delete kost building because it still has active residents.'
        }
      });
    }

    if (payments > 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'PAYMENT_HISTORY_PRESENT',
          message: 'Cannot delete kost building because it has payment transaction history.'
        }
      });
    }

    await prisma.kost.delete({ where: { id } });
    return reply.send({
      success: true,
      data: {
        message: 'Kost deleted successfully.'
      }
    });
  } catch (error) {
    throw error;
  }
};
