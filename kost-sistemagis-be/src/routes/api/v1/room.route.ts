import { FastifyPluginAsync } from 'fastify';
import {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom
} from '../../../controllers/room.controller';
import { requireAuth } from '../../../plugins/auth-guard';
import { requirePermission } from '../../../plugins/rbac-guard';
import { verifyKostOwnership } from '../../../plugins/ownership-guard';
import { createRoomSchema, updateRoomSchema, getRoomsSchema } from '../../schemas/room.schema';

const roomRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'room')];
  const writeAuth = [requireAuth, requirePermission('write', 'room')];
  const manageAuth = [requireAuth, requirePermission('manage', 'room')];

  fastify.get('/', { schema: getRoomsSchema, preHandler: readAuth }, getRooms as any);
  fastify.get('/:id', { preHandler: [...readAuth, verifyKostOwnership] }, getRoom as any);
  fastify.post('/', { schema: createRoomSchema, preHandler: [...writeAuth, verifyKostOwnership] }, createRoom as any);
  fastify.patch('/:id', { schema: updateRoomSchema, preHandler: [...writeAuth, verifyKostOwnership] }, updateRoom as any);
  fastify.delete('/:id', { preHandler: [...manageAuth, verifyKostOwnership] }, deleteRoom as any);
};

export default roomRoutes;
