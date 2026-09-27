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
import {
  getRolesSchema,
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema,
  updateRolePermissionsSchema
} from '../../schemas/role.schema';

const roleRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'role')];
  const writeAuth = [requireAuth, requirePermission('write', 'role')];
  const manageAuth = [requireAuth, requirePermission('manage', 'role')];

  fastify.get('/', { schema: getRolesSchema, preHandler: readAuth }, getRoles as any);
  fastify.post('/', { schema: createRoleSchema, preHandler: writeAuth }, createRole as any);
  fastify.patch('/:id', { schema: updateRoleSchema, preHandler: writeAuth }, updateRole as any);
  fastify.delete('/:id', { schema: deleteRoleSchema, preHandler: manageAuth }, deleteRole as any);
  fastify.post('/:id/permissions', { schema: updateRolePermissionsSchema, preHandler: manageAuth }, updateRolePermissions as any);
};

export default roleRoutes;
