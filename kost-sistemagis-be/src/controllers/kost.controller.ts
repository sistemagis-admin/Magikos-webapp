import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getKosts = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const kosts = await prisma.kost.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return reply.send({ success: true, data: kosts });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching kosts');
    return reply.status(500).send({ success: false, message: 'Failed to fetch kosts' });
  }
};

export const getKost = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = req.params;
    const kost = await prisma.kost.findUnique({ where: { id } });
    if (!kost) {
      return reply.status(404).send({ success: false, message: 'Kost not found' });
    }
    return reply.send({ success: true, data: kost });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching kost');
    return reply.status(500).send({ success: false, message: 'Failed to fetch kost' });
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
    req.log.error(error as Error, 'Error creating kost');
    return reply.status(500).send({ success: false, message: 'Failed to create kost' });
  }
};

export const updateKost = async (req: FastifyRequest<{ Params: { id: string }; Body: Partial<KostBody> }>, reply: FastifyReply) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const existingKost = await prisma.kost.findUnique({ where: { id } });
    if (!existingKost) {
      return reply.status(404).send({ success: false, message: 'Kost not found' });
    }
    const updatedKost = await prisma.kost.update({
      where: { id },
      data
    });
    return reply.send({ success: true, data: updatedKost });
  } catch (error) {
    req.log.error(error as Error, 'Error updating kost');
    return reply.status(500).send({ success: false, message: 'Failed to update kost' });
  }
};

export const deleteKost = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = req.params;
    const existingKost = await prisma.kost.findUnique({ where: { id } });
    if (!existingKost) {
      return reply.status(404).send({ success: false, message: 'Kost not found' });
    }
    await prisma.kost.delete({ where: { id } });
    return reply.send({ success: true, message: 'Kost deleted successfully' });
  } catch (error) {
    req.log.error(error as Error, 'Error deleting kost');
    return reply.status(500).send({ success: false, message: 'Failed to delete kost' });
  }
};
