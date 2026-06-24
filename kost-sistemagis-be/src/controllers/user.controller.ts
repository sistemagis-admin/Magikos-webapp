import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';
import { auth } from '../config/auth';

export const getUsers = async (
  req: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { page = '1', limit = '10', search } = req.query;
    
    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: { roleRelation: true },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return reply.send({ 
      success: true, 
      data: users,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching users');
    return reply.status(500).send({ success: false, message: 'Failed to fetch users' });
  }
};

export const createUser = async (
  req: FastifyRequest<{ Body: { email: string; name: string; password?: string; roleId?: string; role?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { email, name, password, roleId, role } = req.body;
    
    // Default password if not provided
    const userPassword = password || 'defaultPassword123!';
    
    const newAuthUser = await auth.api.signUpEmail({
      body: {
        email,
        password: userPassword,
        name,
      }
    });

    if (!newAuthUser?.user) {
      return reply.status(400).send({ success: false, message: 'Failed to create user via Better Auth' });
    }

    const updateData: any = {};
    if (roleId) {
      updateData.roleId = roleId;
      const roleRecord = await prisma.role.findUnique({ where: { id: roleId } });
      if (roleRecord) {
        updateData.role = roleRecord.name;
      }
    } else if (role) {
      updateData.role = role;
    }

    let finalUser: any = newAuthUser.user;
    if (Object.keys(updateData).length > 0) {
      finalUser = await prisma.user.update({
        where: { id: newAuthUser.user.id },
        data: updateData,
        include: { roleRelation: true }
      });
    } else {
      finalUser = await prisma.user.findUnique({
        where: { id: newAuthUser.user.id },
        include: { roleRelation: true }
      });
    }

    return reply.status(201).send({ success: true, data: finalUser });
  } catch (error: any) {
    req.log.error(error, 'Error creating user');
    return reply.status(500).send({ success: false, message: error.message || 'Failed to create user' });
  }
};

export const getUser = async (
  req: FastifyRequest<{ Params: { id: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roleRelation: true }
    });
    
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }
    
    return reply.send({ success: true, data: user });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching user');
    return reply.status(500).send({ success: false, message: 'Failed to fetch user' });
  }
};

export const updateUserRole = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { roleId?: string; role?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { roleId, role } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }
    
    const updateData: any = {};
    if (roleId !== undefined) {
      updateData.roleId = roleId;
      if (roleId !== null) {
        const roleRecord = await prisma.role.findUnique({ where: { id: roleId } });
        if (roleRecord) {
          updateData.role = roleRecord.name;
        }
      }
    }
    if (role !== undefined) {
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { roleRelation: true }
    });
    
    return reply.send({ success: true, data: updatedUser });
  } catch (error) {
    req.log.error(error as Error, 'Error updating user role');
    return reply.status(500).send({ success: false, message: 'Failed to update user role' });
  }
};

export const deleteUser = async (
  req: FastifyRequest<{ Params: { id: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    
    await prisma.user.delete({
      where: { id }
    });
    
    return reply.send({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    req.log.error(error as Error, 'Error deleting user');
    return reply.status(500).send({ success: false, message: 'Failed to delete user' });
  }
};

export const banUser = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { reason?: string; expiresIn?: number } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { reason, expiresIn } = req.body;
    
    const bannedUntil = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        banned: true,
        banReason: reason,
        banExpires: bannedUntil,
      }
    });

    // Revoke all active sessions
    await prisma.session.deleteMany({
      where: { userId: id }
    });
    
    return reply.send({ success: true, data: updatedUser, message: 'User banned and sessions revoked' });
  } catch (error) {
    req.log.error(error as Error, 'Error banning user');
    return reply.status(500).send({ success: false, message: 'Failed to ban user' });
  }
};

export const unbanUser = async (
  req: FastifyRequest<{ Params: { id: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      }
    });
    
    return reply.send({ success: true, data: updatedUser });
  } catch (error) {
    req.log.error(error as Error, 'Error unbanning user');
    return reply.status(500).send({ success: false, message: 'Failed to unban user' });
  }
};
