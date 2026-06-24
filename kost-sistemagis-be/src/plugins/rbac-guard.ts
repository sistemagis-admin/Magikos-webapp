import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './database';

export const requirePermission = (action: string, resource: string) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    // req.session is populated by requireAuth which runs before this
    const sessionData = req.session;
    
    if (!sessionData?.user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Not authenticated' });
    }
    
    const user = sessionData.user;
    
    // SuperAdmin / better-auth 'admin' role bypass
    if ((user as any).role === 'admin' || (user as any).role === 'SuperAdmin') {
      return; // Admins have all permissions
    }

    // Check specific permission in DB based on roleId
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roleRelation: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    if (!userWithRoles?.roleRelation) {
      return reply.status(403).send({ error: 'Forbidden', message: 'User has no assigned role' });
    }

    const hasPermission = userWithRoles.roleRelation.permissions.some(
      (rp) => rp.permission.action === action && rp.permission.resource === resource
    );

    if (!hasPermission) {
      return reply.status(403).send({ 
        error: 'Forbidden', 
        message: `Missing required permission: ${action} on ${resource}` 
      });
    }
  };
};
