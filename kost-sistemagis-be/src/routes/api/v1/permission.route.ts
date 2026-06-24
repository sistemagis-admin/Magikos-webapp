import { FastifyPluginAsync } from 'fastify';
import {
  getPermissions,
  createPermission,
  deletePermission
} from '../../../controllers/permission.controller';
import { requireAuth } from '../../../plugins/auth-guard';
import { requirePermission } from '../../../plugins/rbac-guard';

const permissionRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'permission')];
  const manageAuth = [requireAuth, requirePermission('manage', 'permission')];

  fastify.get('/', { preHandler: readAuth }, getPermissions as any);
  fastify.post('/', { preHandler: manageAuth }, createPermission as any);
  fastify.delete('/:id', { preHandler: manageAuth }, deletePermission as any);
};

export default permissionRoutes;
