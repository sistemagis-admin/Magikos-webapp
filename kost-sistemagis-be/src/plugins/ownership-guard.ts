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

  const kostIdsToCheck = new Set<string>();

  // 1. Resolve kostId from Route Params (e.g., id of Kost, Room, or Resident)
  if (req.params && (req.params as any).id) {
    const id = (req.params as any).id;
    const url = req.url;

    if (url.includes('/kosts/')) {
      kostIdsToCheck.add(id);
    } else if (url.includes('/rooms/')) {
      const room = await prisma.room.findUnique({
        where: { id },
        select: { kostId: true }
      });
      if (room?.kostId) {
        kostIdsToCheck.add(room.kostId);
      }
    } else if (url.includes('/residents/')) {
      const resident = await prisma.resident.findUnique({
        where: { id },
        select: { kostId: true }
      });
      if (resident?.kostId) {
        kostIdsToCheck.add(resident.kostId);
      }
    }
  }

  // 2. Resolve kostId from Request Body (e.g. creating/updating Rooms or Residents, or transferring)
  if (req.body) {
    const body = req.body as any;
    if (body.kostId) {
      kostIdsToCheck.add(body.kostId);
    }

    if (body.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: body.roomId },
        select: { kostId: true }
      });
      if (room?.kostId) {
        kostIdsToCheck.add(room.kostId);
      }
    }
  }

  // 3. Resolve kostId from Query Parameters (e.g. GET /rooms?kostId=...)
  if (req.query && (req.query as any).kostId) {
    kostIdsToCheck.add((req.query as any).kostId);
  }

  // If creating room or resident, kostId must be present
  if (kostIdsToCheck.size === 0 && req.method === 'POST') {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'KOST_ID_REQUIRED',
        message: 'A valid kostId must be specified for this operation.'
      }
    });
  }

  // If no kostId is resolved for GET/filter operations, pass to controller (where list-filtering applies)
  if (kostIdsToCheck.size === 0) {
    return;
  }

  // 4. Verify user manages EVERY kost building referenced in the request
  for (const kId of kostIdsToCheck) {
    const isManager = await prisma.kostManager.findUnique({
      where: {
        userId_kostId: {
          userId: user.id,
          kostId: kId
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
}

