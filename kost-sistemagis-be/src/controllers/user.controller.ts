import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';
import { getAuth } from '../config/auth';

export const getUsers = async (
  req: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { page = '1', limit = '10', search } = req.query;
    
    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const parsedLimit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const limitNum = Math.min(parsedLimit, 100);
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
    throw error;
  }
};

export const createUser = async (
  req: FastifyRequest<{ Body: { email: string; name: string; password?: string; roleId?: string; role?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const caller = req.session?.user;
    const callerIsAdmin = caller && ((caller as any).role === 'admin' || (caller as any).role === 'SuperAdmin');

    const { email, name, password, roleId, role } = req.body || {};

    if (!email || !name) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Email and name are required.'
        }
      });
    }

    // Security Check: Only admins can assign 'admin' or 'SuperAdmin' roles
    let assignedRoleName = role;
    if (roleId) {
      const roleRecord = await prisma.role.findUnique({ where: { id: roleId } });
      if (roleRecord) {
        assignedRoleName = roleRecord.name;
      }
    }

    if (assignedRoleName === 'admin' || assignedRoleName === 'SuperAdmin') {
      if (!callerIsAdmin) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators can assign administrative roles.'
          }
        });
      }
    }
    
    // Default password if not provided
    const userPassword = password || 'defaultPassword123!';
    
    const auth = await getAuth();
    const newAuthUser = await auth.api.signUpEmail({
      body: {
        email,
        password: userPassword,
        name,
      }
    });

    if (!newAuthUser?.user) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'USER_CREATION_FAILED',
          message: 'Failed to create user account.'
        }
      });
    }

    const updateData: any = {};
    if (roleId) {
      updateData.roleId = roleId;
      if (assignedRoleName) {
        updateData.role = assignedRoleName;
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
    throw error;
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
      return reply.status(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The requested user could not be found.'
        }
      });
    }
    
    return reply.send({ success: true, data: user });
  } catch (error) {
    req.log.error(error as Error, 'Error fetching user');
    throw error;
  }
};

export const updateUserRole = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { roleId?: string; role?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const caller = req.session?.user;
    const callerIsAdmin = caller && ((caller as any).role === 'admin' || (caller as any).role === 'SuperAdmin');

    const { id } = req.params;
    const { roleId, role } = req.body || {};
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The target user could not be found.'
        }
      });
    }

    // Security Check: Only SuperAdmin / admin can elevate someone to admin
    let targetRoleName = role;
    if (roleId) {
      const roleRecord = await prisma.role.findUnique({ where: { id: roleId } });
      if (roleRecord) {
        targetRoleName = roleRecord.name;
      }
    }

    if (targetRoleName === 'admin' || targetRoleName === 'SuperAdmin') {
      if (!callerIsAdmin) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators can assign administrative roles.'
          }
        });
      }
    }
    
    const updateData: any = {};
    if (roleId !== undefined) {
      updateData.roleId = roleId;
      if (roleId !== null && targetRoleName) {
        updateData.role = targetRoleName;
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
    throw error;
  }
};

export const deleteUser = async (
  req: FastifyRequest<{ Params: { id: string } }>, 
  reply: FastifyReply
) => {
  try {
    const caller = req.session?.user;
    const { id } = req.params;

    if (caller?.id === id) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'You cannot delete your own user account.'
        }
      });
    }
    
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The requested user could not be found.'
        }
      });
    }

    await prisma.user.delete({
      where: { id }
    });
    
    return reply.send({
      success: true,
      data: {
        message: 'User deleted successfully.'
      }
    });
  } catch (error) {
    req.log.error(error as Error, 'Error deleting user');
    throw error;
  }
};

export const banUser = async (
  req: FastifyRequest<{ Params: { id: string }; Body?: { reason?: string; expiresIn?: number } }>, 
  reply: FastifyReply
) => {
  try {
    const caller = req.session?.user;
    const { id } = req.params;
    const { reason, expiresIn } = req.body || {};

    if (caller?.id === id) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'CANNOT_BAN_SELF',
          message: 'You cannot ban or deactivate your own account.'
        }
      });
    }
    
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The requested user could not be found.'
        }
      });
    }

    const bannedUntil = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        banned: true,
        banReason: reason || 'Deactivated by administrator',
        banExpires: bannedUntil,
      }
    });

    // Revoke all active sessions
    await prisma.session.deleteMany({
      where: { userId: id }
    });
    
    return reply.send({
      success: true,
      data: updatedUser,
      message: 'User banned and all active sessions revoked.'
    });
  } catch (error) {
    req.log.error(error as Error, 'Error banning user');
    throw error;
  }
};

export const unbanUser = async (
  req: FastifyRequest<{ Params: { id: string } }>, 
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The requested user could not be found.'
        }
      });
    }

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
    throw error;
  }
};

