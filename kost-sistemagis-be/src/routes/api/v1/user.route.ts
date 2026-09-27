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
import {
  getUsersSchema,
  getUserSchema,
  createUserSchema,
  updateUserRoleSchema,
  deleteUserSchema,
  banUserSchema,
  unbanUserSchema
} from '../../schemas/user.schema';

const userRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'user')];
  const writeAuth = [requireAuth, requirePermission('write', 'user')];
  const manageAuth = [requireAuth, requirePermission('manage', 'user')];

  fastify.get('/', { schema: getUsersSchema, preHandler: readAuth }, getUsers as any);
  fastify.post('/', { schema: createUserSchema, preHandler: manageAuth }, createUser as any);
  fastify.get('/:id', { schema: getUserSchema, preHandler: readAuth }, getUser as any);
  fastify.patch('/:id/role', { schema: updateUserRoleSchema, preHandler: writeAuth }, updateUserRole as any);
  fastify.delete('/:id', { schema: deleteUserSchema, preHandler: manageAuth }, deleteUser as any);
  fastify.post('/:id/ban', { schema: banUserSchema, preHandler: manageAuth }, banUser as any);
  fastify.post('/:id/unban', { schema: unbanUserSchema, preHandler: manageAuth }, unbanUser as any);
};

export default userRoutes;
