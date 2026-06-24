import { FastifyPluginAsync } from 'fastify';
import { getDashboardData } from '../../../controllers/dashboard.controller';
import { requireAuth } from '../../../plugins/auth-guard';

const dashboardRoutes: FastifyPluginAsync = async (fastify, options) => {
  fastify.get('/', { preHandler: requireAuth }, getDashboardData.bind(fastify));
};

export default dashboardRoutes;
