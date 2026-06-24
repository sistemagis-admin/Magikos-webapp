import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getPermissions = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const permissions = await prisma.permission.findMany();
    return reply.send({ success: true, data: permissions });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching permissions');
    return reply.status(500).send({ success: false, message: 'Failed to fetch permissions' });
  }
};

export const createPermission = async (
  req: FastifyRequest<{ Body: { action: string; resource: string; description?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { action, resource, description } = req.body;
    const permission = await prisma.permission.create({
      data: { action, resource, description }
    });
    return reply.send({ success: true, data: permission });
  } catch (error) {
    req.log.error(error as Error, 'Error creating permission');
    return reply.status(500).send({ success: false, message: 'Failed to create permission' });
  }
};

export const deletePermission = async (
  req: FastifyRequest<{ Params: { id: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    await prisma.permission.delete({ where: { id } });
    return reply.send({ success: true, message: 'Permission deleted successfully' });
  } catch (error) {
    req.log.error(error as Error, 'Error deleting permission');
    return reply.status(500).send({ success: false, message: 'Failed to delete permission' });
  }
};
