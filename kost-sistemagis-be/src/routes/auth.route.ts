import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { toWebHeaders } from '../utils/headers';
import { getAuth } from '../config/auth';
import { signUpSchema, signInSchema, signOutSchema, getSessionSchema } from './schemas/auth.schema';
import { handlePrismaError } from '../utils/error-handler';

// Helper untuk format error auth yang informatif
function formatAuthError(error: any, reply: FastifyReply) {
  const dbError = handlePrismaError(error);
  if (dbError) {
    return reply.status(dbError.statusCode).send({
      success: false,
      error: {
        code: dbError.code,
        message: dbError.message,
        details: error.message
      }
    });
  }

  const rawStatus = error.status || error.statusCode;
  let statusCode = 400;
  if (typeof rawStatus === 'number') {
    statusCode = rawStatus;
  } else if (rawStatus === 'UNPROCESSABLE_ENTITY') {
    statusCode = 422;
  } else if (rawStatus === 'UNAUTHORIZED') {
    statusCode = 401;
  }

  const message = error.body?.message || error.message || 'Authentication error';
  const code = error.body?.code || error.code || 'AUTH_ERROR';

  return reply.status(statusCode).send({
    success: false,
    error: {
      code,
      message,
      details: error.body || error.message
    }
  });
}

// Fallback helper untuk memproses request wildcard Better Auth (seperti OAuth, reset password, dll)
async function handleBetterAuthFallback(request: FastifyRequest, reply: FastifyReply) {
  try {
    const auth = await getAuth();
    const host = (request.headers['x-forwarded-host'] as string) || request.headers.host || 'localhost:3000';
    const proto = (request.headers['x-forwarded-proto'] as string) || request.protocol || 'https';
    const url = new URL(request.url, `${proto}://${host}`);
    const headers = toWebHeaders(request.headers);
    
    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      ...(request.body ? { body: JSON.stringify(request.body) } : {}),
    });

    const response = await auth.handler(req);

    // Forward headers
    response.headers.forEach((value: string, key: string) => reply.header(key, value));

    if (response.status >= 300 && response.status < 400) {
      reply.status(response.status);
      return reply.send(response.body ? await response.text() : null);
    }

    const bodyText = response.body ? await response.text() : null;
    let bodyJSON: any = null;
    if (bodyText) {
      try {
        bodyJSON = JSON.parse(bodyText);
      } catch (e) {
        // Bukan format JSON
      }
    }

    if (response.status >= 200 && response.status < 300) {
      return reply.status(response.status).send({
        success: true,
        data: bodyJSON || bodyText
      });
    }

    reply.status(response.status);
    return reply.send({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: bodyJSON?.message || bodyText || 'Authentication failed.',
        details: bodyJSON
      }
    });
  } catch (error: any) {
    return formatAuthError(error, reply);
  }
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Endpoint Registrasi (Sign Up)
  fastify.post('/sign-up/email', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    },
    schema: signUpSchema
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const auth = await getAuth();
      const res = await auth.api.signUpEmail({
        body: request.body as any,
        headers: toWebHeaders(request.headers)
      });
      return reply.status(200).send({
        success: true,
        data: res
      });
    } catch (error: any) {
      return formatAuthError(error, reply);
    }
  });

  // 2. Endpoint Login (Sign In)
  fastify.post('/sign-in/email', {
    config: {
      rateLimit: {
        max: 15,
        timeWindow: '1 minute'
      }
    },
    schema: signInSchema
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const auth = await getAuth();
      const res = await auth.api.signInEmail({
        body: request.body as any,
        headers: toWebHeaders(request.headers)
      });
      return reply.status(200).send({
        success: true,
        data: res
      });
    } catch (error: any) {
      return formatAuthError(error, reply);
    }
  });

  // 3. Endpoint Logout (Sign Out)
  fastify.post('/sign-out', {
    schema: signOutSchema
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const auth = await getAuth();
      await auth.api.signOut({
        headers: toWebHeaders(request.headers)
      });
      return reply.status(200).send({
        success: true,
        data: { message: 'Successfully signed out' }
      });
    } catch (error: any) {
      return formatAuthError(error, reply);
    }
  });

  // 4. Endpoint Get Session
  fastify.get('/get-session', {
    schema: getSessionSchema
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const auth = await getAuth();
      const session = await auth.api.getSession({
        headers: toWebHeaders(request.headers)
      });
      return reply.status(200).send({
        success: true,
        data: session
      });
    } catch (error: any) {
      return formatAuthError(error, reply);
    }
  });

  // Fallback wildcard rute untuk menangkap sisa API internal Better Auth (seperti OAuth, reset password, dll.)
  fastify.route({
    method: ['GET', 'POST'],
    url: '/*',
    handler: handleBetterAuthFallback,
  });
};

export default authRoutes;
