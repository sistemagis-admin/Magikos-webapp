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

const roomRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'room')];
  const writeAuth = [requireAuth, requirePermission('write', 'room')];
  const manageAuth = [requireAuth, requirePermission('manage', 'room')];

  fastify.get('/', { preHandler: readAuth }, getRooms as any);
  fastify.get('/:id', { preHandler: readAuth }, getRoom as any);
  fastify.post('/', { preHandler: writeAuth }, createRoom as any);
  fastify.patch('/:id', { preHandler: writeAuth }, updateRoom as any);
  fastify.delete('/:id', { preHandler: manageAuth }, deleteRoom as any);
};

export default roomRoutes;
