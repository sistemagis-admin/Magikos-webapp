import { FastifyPluginAsync } from 'fastify';
import {
  getKosts,
  getKost,
  createKost,
  updateKost,
  deleteKost
} from '../../../controllers/kost.controller';
import { requireAuth } from '../../../plugins/auth-guard';
import { requirePermission } from '../../../plugins/rbac-guard';
import { verifyKostOwnership } from '../../../plugins/ownership-guard';
import { createKostSchema, updateKostSchema } from '../../schemas/kost.schema';

const kostRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'kost')];
  const writeAuth = [requireAuth, requirePermission('write', 'kost')];
  const manageAuth = [requireAuth, requirePermission('manage', 'kost')];

  fastify.get('/', { preHandler: readAuth }, getKosts as any);
  fastify.get('/:id', { preHandler: [...readAuth, verifyKostOwnership] }, getKost as any);
  fastify.post('/', { schema: createKostSchema, preHandler: writeAuth }, createKost as any);
  fastify.patch('/:id', { schema: updateKostSchema, preHandler: [...writeAuth, verifyKostOwnership] }, updateKost as any);
  fastify.delete('/:id', { preHandler: [...manageAuth, verifyKostOwnership] }, deleteKost as any);
};

export default kostRoutes;
