import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './database';

/**
 * Pre-handler hook to verify that the logged-in user has ownership (management)
 * rights over the requested Kost, Room, or Resident.
 */
export async function verifyKostOwnership(req: FastifyRequest, reply: FastifyReply) {
  const user = req.session?.user;
  if (!user) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to perform this action.'
      }
    });
  }

  // Admin Sistemagis (SuperAdmin/admin) bypasses ownership checks
  if ((user as any).role === 'admin' || (user as any).role === 'SuperAdmin') {
    return;
  }

  let kostId: string | undefined = undefined;

  // 1. Resolve kostId from Route Params (e.g., id of Kost, Room, or Resident)
  if (req.params && (req.params as any).id) {
    const id = (req.params as any).id;
    const url = req.url;

    if (url.includes('/kosts/')) {
      kostId = id;
    } else if (url.includes('/rooms/')) {
      const room = await prisma.room.findUnique({
        where: { id },
        select: { kostId: true }
      });
      kostId = room?.kostId;
    } else if (url.includes('/residents/')) {
      const resident = await prisma.resident.findUnique({
        where: { id },
        select: { kostId: true }
      });
      kostId = resident?.kostId;
    }
  }

  // 2. Resolve kostId from Request Body (e.g. creating/updating Rooms or Residents)
  if (!kostId && req.body) {
    kostId = (req.body as any).kostId;

    if (!kostId && (req.body as any).roomId) {
      const room = await prisma.room.findUnique({
        where: { id: (req.body as any).roomId },
        select: { kostId: true }
      });
      kostId = room?.kostId;
    }
  }

  // 3. Resolve kostId from Query Parameters (e.g. GET /rooms?kostId=...)
  if (!kostId && req.query) {
    kostId = (req.query as any).kostId;
  }

  // If no kostId is resolved, pass to controller (where list-filtering will apply if needed)
  if (!kostId) {
    return;
  }

  // 4. Verify if the user is a manager for this kost
  const isManager = await prisma.kostManager.findUnique({
    where: {
      userId_kostId: {
        userId: user.id,
        kostId
      }
    }
  });

  if (!isManager) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to manage this kost building.'
      }
    });
  }
}
