import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getKosts = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const kosts = await prisma.kost.findMany({
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
