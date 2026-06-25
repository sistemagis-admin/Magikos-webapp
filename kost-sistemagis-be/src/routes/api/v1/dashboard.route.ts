import { FastifyPluginAsync } from 'fastify';
import { getDashboardData } from '../../../controllers/dashboard.controller';
import { requireAuth } from '../../../plugins/auth-guard';
import { requirePermission } from '../../../plugins/rbac-guard';

const dashboardRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'dashboard')];
  fastify.get('/', { preHandler: readAuth }, getDashboardData.bind(fastify));
};

export default dashboardRoutes;
