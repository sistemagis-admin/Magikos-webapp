import { FastifyPluginAsync } from 'fastify';
import {
  getResidents,
  getResident,
  createResident,
  updateResident,
  deleteResident
} from '../../../controllers/resident.controller';
import { requireAuth } from '../../../plugins/auth-guard';
import { requirePermission } from '../../../plugins/rbac-guard';
import { verifyKostOwnership } from '../../../plugins/ownership-guard';
import {
  createResidentSchema,
  updateResidentSchema,
  getResidentsSchema,
  getResidentSchema,
  deleteResidentSchema
} from '../../schemas/resident.schema';

const residentRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'resident')];
  const writeAuth = [requireAuth, requirePermission('write', 'resident')];
  const manageAuth = [requireAuth, requirePermission('manage', 'resident')];

  fastify.get('/', { schema: getResidentsSchema, preHandler: readAuth }, getResidents as any);
  fastify.get('/:id', { schema: getResidentSchema, preHandler: [...readAuth, verifyKostOwnership] }, getResident as any);
  fastify.post('/', { schema: createResidentSchema, preHandler: [...writeAuth, verifyKostOwnership] }, createResident as any);
  fastify.patch('/:id', { schema: updateResidentSchema, preHandler: [...writeAuth, verifyKostOwnership] }, updateResident as any);
  fastify.delete('/:id', { schema: deleteResidentSchema, preHandler: [...manageAuth, verifyKostOwnership] }, deleteResident as any);
};

export default residentRoutes;
