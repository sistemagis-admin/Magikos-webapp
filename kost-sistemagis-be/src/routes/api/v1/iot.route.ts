// src/routes/api/v1/iot.route.ts
import { FastifyPluginAsync } from 'fastify';
import { manualOpenDoor } from '../../../controllers/iot.controller';
import { requireAuth } from '../../../plugins/auth-guard';
import { requirePermission } from '../../../plugins/rbac-guard';

const iotRoutes: FastifyPluginAsync = async (fastify, options) => {
  const manageAuth = [requireAuth, requirePermission('manage', 'iot')];
  fastify.post('/door/open', { preHandler: manageAuth }, manualOpenDoor.bind(fastify) as any);
};

export default iotRoutes;
