import { FastifyPluginAsync } from 'fastify';
import {
  getPermissions,
  createPermission,
  deletePermission
} from '../../../controllers/permission.controller';
import { requireAuth } from '../../../plugins/auth-guard';
import { requirePermission } from '../../../plugins/rbac-guard';
import {
  getPermissionsSchema,
  createPermissionSchema,
  deletePermissionSchema
} from '../../schemas/permission.schema';

const permissionRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'permission')];
  const manageAuth = [requireAuth, requirePermission('manage', 'permission')];

  fastify.get('/', { schema: getPermissionsSchema, preHandler: readAuth }, getPermissions as any);
  fastify.post('/', { schema: createPermissionSchema, preHandler: manageAuth }, createPermission as any);
  fastify.delete('/:id', { schema: deletePermissionSchema, preHandler: manageAuth }, deletePermission as any);
};

export default permissionRoutes;
