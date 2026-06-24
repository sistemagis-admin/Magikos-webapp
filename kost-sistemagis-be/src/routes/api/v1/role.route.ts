import { FastifyPluginAsync } from 'fastify';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions
} from '../../../controllers/role.controller';
import { requireAuth } from '../../../plugins/auth-guard';
import { requirePermission } from '../../../plugins/rbac-guard';

const roleRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'role')];
  const writeAuth = [requireAuth, requirePermission('write', 'role')];
  const manageAuth = [requireAuth, requirePermission('manage', 'role')];

  fastify.get('/', { preHandler: readAuth }, getRoles as any);
  fastify.post('/', { preHandler: writeAuth }, createRole as any);
  fastify.patch('/:id', { preHandler: writeAuth }, updateRole as any);
  fastify.delete('/:id', { preHandler: manageAuth }, deleteRole as any);
  fastify.post('/:id/permissions', { preHandler: manageAuth }, updateRolePermissions as any);
};

export default roleRoutes;
