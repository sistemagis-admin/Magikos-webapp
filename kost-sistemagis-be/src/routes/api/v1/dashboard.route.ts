import { FastifyPluginAsync } from 'fastify';
import { getDashboardData } from '../../../controllers/dashboard.controller';
import { requireAuth } from '../../../plugins/auth-guard';
import { requirePermission } from '../../../plugins/rbac-guard';
import { getDashboardSchema } from '../../schemas/dashboard.schema';

const dashboardRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'dashboard')];
  fastify.get('/', { schema: getDashboardSchema, preHandler: readAuth }, getDashboardData.bind(fastify) as any);
};

export default dashboardRoutes;
