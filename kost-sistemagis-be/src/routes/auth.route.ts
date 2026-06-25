import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { fromNodeHeaders } from "better-auth/node";
import { auth } from '../config/auth';
import { signUpSchema, signInSchema, signOutSchema, getSessionSchema } from './schemas/auth.schema';

// Helper untuk memproses request menggunakan handler Better Auth
async function handleBetterAuth(request: FastifyRequest, reply: FastifyReply) {
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
    request.log.error(error as Error, 'Authentication Error');
    return reply.status(500).send({ error: 'Internal authentication error' });
  }
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Endpoint Registrasi (Sign Up)
  fastify.post('/sign-up/email', {
    schema: signUpSchema
  }, handleBetterAuth);

  // 2. Endpoint Login (Sign In)
  fastify.post('/sign-in/email', {
    schema: signInSchema
  }, handleBetterAuth);

  // 3. Endpoint Logout (Sign Out)
  fastify.post('/sign-out', {
    schema: signOutSchema
  }, handleBetterAuth);

  // 4. Endpoint Get Session
  fastify.get('/get-session', {
    schema: getSessionSchema
  }, handleBetterAuth);

  // Fallback wildcard rute untuk menangkap sisa API internal Better Auth (seperti OAuth, reset password, dll.)
  fastify.route({
    method: ['GET', 'POST'],
    url: '/*',
    handler: handleBetterAuth,
  });
};

export default authRoutes;
