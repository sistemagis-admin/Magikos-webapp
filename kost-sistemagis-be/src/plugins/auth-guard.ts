import { FastifyRequest, FastifyReply } from 'fastify';
import { toWebHeaders } from '../utils/headers';
import { auth } from '../config/auth';
import { Session, User } from 'better-auth';

declare module 'fastify' {
  interface FastifyRequest {
    session?: {
      session: Session;
      user: User;
    } | null;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await auth.api.getSession({
      headers: toWebHeaders(req.headers),
    });

    if (!session) {
      return reply.status(401).send({ 
        success: false,
        error: {
          code: 'UNAUTHORIZED', 
          message: 'You must be logged in to access this resource.' 
        }
      });
    }

    // Periksa apakah user sudah di-ban
    const user = session.user as any;
    if (user.banned === true) {
      const banExpires = user.banExpires ? new Date(user.banExpires) : null;
      // Jika masa ban belum habis, izinkan masuk (ban expired)
      if (!banExpires || banExpires > new Date()) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: user.banReason
              ? `Your account has been deactivated. Reason: ${user.banReason}`
              : 'Your account has been deactivated by the administrator.'
          }
        });
      }
    }

    req.session = session;
  } catch (error) {
    req.log.error(error as Error, 'Auth Guard Error');
    return reply.status(500).send({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR', 
        message: 'Failed to verify session.' 
      }
    });
  }
}
