import { FastifyPluginAsync } from 'fastify';
import { fromNodeHeaders } from "better-auth/node";
import { auth } from '../config/auth';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: ['GET', 'POST'],
    url: '/*',
    async handler(request, reply) {
      try {
        const url = new URL(request.url, `${request.protocol}://${request.headers.host}`);
        const headers = fromNodeHeaders(request.headers);
        
        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          ...(request.body ? { body: JSON.stringify(request.body) } : {}),
        });

        const response = await auth.handler(req);

        reply.status(response.status);
        response.headers.forEach((value, key) => reply.header(key, value));

        return reply.send(response.body ? await response.text() : null);
      } catch (error) {
        fastify.log.error(error as Error, 'Authentication Error');
        return reply.status(500).send({ error: 'Internal authentication error' });
      }
    },
  });
};

export default authRoutes;
