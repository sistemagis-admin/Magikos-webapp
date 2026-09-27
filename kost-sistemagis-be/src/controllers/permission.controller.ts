import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getPermissions = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }]
    });
    return reply.send({ success: true, data: permissions });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching permissions');
    throw error;
  }
};

export const createPermission = async (
  req: FastifyRequest<{ Body: { action: string; resource: string; description?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { action, resource, description } = req.body || {};

    if (!action || !resource) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Both action and resource are required.'
        }
      });
    }

    const permission = await prisma.permission.create({
      data: { action, resource, description }
    });
    return reply.status(201).send({ success: true, data: permission });
  } catch (error) {
    req.log.error(error as Error, 'Error creating permission');
    throw error;
  }
};

export const deletePermission = async (
  req: FastifyRequest<{ Params: { id: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;

    const existing = await prisma.permission.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'PERMISSION_NOT_FOUND',
          message: 'The requested permission could not be found.'
        }
      });
    }

    await prisma.permission.delete({ where: { id } });
    return reply.send({
      success: true,
      data: {
        message: 'Permission deleted successfully.'
      }
    });
  } catch (error) {
    req.log.error(error as Error, 'Error deleting permission');
    throw error;
  }
};

