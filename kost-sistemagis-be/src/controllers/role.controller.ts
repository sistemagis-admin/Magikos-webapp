import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export const getRoles = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
    return reply.send({ success: true, data: roles });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching roles');
    return reply.status(500).send({ success: false, message: 'Failed to fetch roles' });
  }
};

export const createRole = async (
  req: FastifyRequest<{ Body: { name: string; description?: string; permissionIds?: string[] } }>, 
  reply: FastifyReply
) => {
  try {
    const { name, description, permissionIds } = req.body;
    
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionIds ? {
          create: permissionIds.map(id => ({
            permission: { connect: { id } }
          }))
        } : undefined
      },
      include: {
        permissions: true
      }
    });
    
    return reply.send({ success: true, data: role });
  } catch (error) {
    req.log.error(error as Error, 'Error creating role');
    return reply.status(500).send({ success: false, message: 'Failed to create role' });
  }
};

export const updateRole = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { name?: string; description?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const role = await prisma.role.update({
      where: { id },
      data: { name, description }
    });
    
    return reply.send({ success: true, data: role });
  } catch (error) {
    req.log.error(error as Error, 'Error updating role');
    return reply.status(500).send({ success: false, message: 'Failed to update role' });
  }
};

export const deleteRole = async (
  req: FastifyRequest<{ Params: { id: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    
    await prisma.role.delete({ where: { id } });
    
    return reply.send({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    req.log.error(error as Error, 'Error deleting role');
    return reply.status(500).send({ success: false, message: 'Failed to delete role' });
  }
};

export const updateRolePermissions = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { permissionIds: string[] } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;
    
    await prisma.rolePermission.deleteMany({
      where: { roleId: id }
    });
    
    if (permissionIds && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permId => ({
          roleId: id,
          permissionId: permId
        }))
      });
    }
    
    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } }
    });
    
    return reply.send({ success: true, data: updatedRole });
  } catch (error) {
    req.log.error(error as Error, 'Error updating role permissions');
    return reply.status(500).send({ success: false, message: 'Failed to update role permissions' });
  }
};
