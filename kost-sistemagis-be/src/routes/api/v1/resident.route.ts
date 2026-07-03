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
import { createResidentSchema, updateResidentSchema, getResidentsSchema } from '../../schemas/resident.schema';

const residentRoutes: FastifyPluginAsync = async (fastify, options) => {
  const readAuth = [requireAuth, requirePermission('read', 'resident')];
  const writeAuth = [requireAuth, requirePermission('write', 'resident')];
  const manageAuth = [requireAuth, requirePermission('manage', 'resident')];

  fastify.get('/', { schema: getResidentsSchema, preHandler: readAuth }, getResidents as any);
  fastify.get('/:id', { preHandler: readAuth }, getResident as any);
  fastify.post('/', { schema: createResidentSchema, preHandler: writeAuth }, createResident as any);
  fastify.patch('/:id', { schema: updateResidentSchema, preHandler: writeAuth }, updateResident as any);
  fastify.delete('/:id', { preHandler: manageAuth }, deleteResident as any);
};

export default residentRoutes;
