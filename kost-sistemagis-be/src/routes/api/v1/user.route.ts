import { FastifyPluginAsync } from 'fastify';
import {
  getUsers,
  getUser,
  createUser,
  updateUserRole,
  deleteUser,
  banUser,
  unbanUser
} from '../../../controllers/user.controller';
import { requireAuth } from '../../../plugins/auth-guard';
import { requirePermission } from '../../../plugins/rbac-guard';

const userRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'user')];
  const writeAuth = [requireAuth, requirePermission('write', 'user')];
  const manageAuth = [requireAuth, requirePermission('manage', 'user')];

  fastify.get('/', { preHandler: readAuth }, getUsers as any);
  fastify.post('/', { preHandler: manageAuth }, createUser as any);
  fastify.get('/:id', { preHandler: readAuth }, getUser as any);
  fastify.patch('/:id/role', { preHandler: writeAuth }, updateUserRole as any);
  fastify.delete('/:id', { preHandler: manageAuth }, deleteUser as any);
  fastify.post('/:id/ban', { preHandler: manageAuth }, banUser as any);
  fastify.post('/:id/unban', { preHandler: manageAuth }, unbanUser as any);
};

export default userRoutes;
