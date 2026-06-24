import { FastifyRequest, FastifyReply } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
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
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return reply.status(401).send({ 
        error: 'Unauthorized', 
        message: 'You must be logged in to access this resource.' 
      });
    }

    req.session = session;
  } catch (error) {
    req.log.error(error as Error, 'Auth Guard Error');
    return reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to verify session' 
    });
  }
}
