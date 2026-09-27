import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getRoles = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return reply.send({ success: true, data: roles });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching roles');
    throw error;
  }
};

export const createRole = async (
  req: FastifyRequest<{ Body: { name: string; description?: string; permissionIds?: string[] } }>, 
  reply: FastifyReply
) => {
  try {
    const { name, description, permissionIds } = req.body || {};

    if (!name) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Role name is required.'
        }
      });
    }
    
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionIds && permissionIds.length > 0 ? {
          create: permissionIds.map(id => ({
            permission: { connect: { id } }
          }))
        } : undefined
      },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
    
    return reply.status(201).send({ success: true, data: role });
  } catch (error) {
    req.log.error(error as Error, 'Error creating role');
    throw error;
  }
};

export const updateRole = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { name?: string; description?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body || {};

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'The requested role could not be found.'
        }
      });
    }

    if (existing.name === 'SuperAdmin' && name && name !== 'SuperAdmin') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'SYSTEM_ROLE_PROTECTED',
          message: 'The built-in SuperAdmin role name cannot be modified.'
        }
      });
    }
    
    const role = await prisma.role.update({
      where: { id },
      data: { name, description },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
    
    return reply.send({ success: true, data: role });
  } catch (error) {
    req.log.error(error as Error, 'Error updating role');
    throw error;
  }
};

export const deleteRole = async (
  req: FastifyRequest<{ Params: { id: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'The requested role could not be found.'
        }
      });
    }

    if (existing.name === 'SuperAdmin') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'SYSTEM_ROLE_PROTECTED',
          message: 'The built-in SuperAdmin role cannot be deleted.'
        }
      });
    }
    
    await prisma.role.delete({ where: { id } });
    
    return reply.send({
      success: true,
      data: {
        message: 'Role deleted successfully.'
      }
    });
  } catch (error) {
    req.log.error(error as Error, 'Error deleting role');
    throw error;
  }
};

export const updateRolePermissions = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { permissionIds: string[] } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body || {};

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'The requested role could not be found.'
        }
      });
    }

    if (existing.name === 'SuperAdmin') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'SYSTEM_ROLE_PROTECTED',
          message: 'Permissions for the built-in SuperAdmin role cannot be revoked.'
        }
      });
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId: id }
      });
      
      if (permissionIds && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permId => ({
            roleId: id,
            permissionId: permId
          }))
        });
      }
    });
    
    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } }
    });
    
    return reply.send({ success: true, data: updatedRole });
  } catch (error) {
    req.log.error(error as Error, 'Error updating role permissions');
    throw error;
  }
};

