// src/routes/api/v1/iot.route.ts
import { FastifyPluginAsync } from 'fastify';
import { manualOpenDoor } from '../../../controllers/iot.controller';

const iotRoutes: FastifyPluginAsync = async (fastify, options) => {
  fastify.post('/door/open', manualOpenDoor.bind(fastify));
};

export default iotRoutes;
