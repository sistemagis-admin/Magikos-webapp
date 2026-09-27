import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { toWebHeaders } from '../utils/headers';
import { auth } from '../config/auth';
import { signUpSchema, signInSchema, signOutSchema, getSessionSchema } from './schemas/auth.schema';

import { handlePrismaError } from '../utils/error-handler';

// Helper untuk memproses request menggunakan handler Better Auth
async function handleBetterAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const url = new URL(request.url, `${request.protocol}://${request.headers.host}`);
    const headers = toWebHeaders(request.headers);
    
    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      ...(request.body ? { body: JSON.stringify(request.body) } : {}),
    });

    const response = await auth.handler(req);

    // Forward headers
    response.headers.forEach((value, key) => reply.header(key, value));

    // Jika ini adalah redirect (3xx), teruskan secara langsung tanpa diubah
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

    // Penanganan respon sukses (2xx)
    if (response.status >= 200 && response.status < 300) {
      return reply.status(response.status).send({
        success: true,
        data: bodyJSON || bodyText
      });
    }

    // Penanganan error response (4xx / 5xx)
    reply.status(response.status);
    if (bodyJSON) {
      let errorCode = 'AUTH_ERROR';
      let errorMessage = bodyJSON.message || bodyJSON.error || 'Authentication failed.';
      
      const rawError = (bodyJSON.error || bodyJSON.message || '').toLowerCase();
      
      if (rawError.includes('already in use') || rawError.includes('already_in_use') || rawError.includes('email already exists')) {
        errorCode = 'EMAIL_ALREADY_IN_USE';
        errorMessage = 'Email address is already registered. Please use another email or log in directly.';
      } else if (rawError.includes('invalid email or password') || rawError.includes('invalid_email_or_password') || rawError.includes('invalid password') || rawError.includes('credentials_missing') || rawError.includes('invalid credentials')) {
        errorCode = 'INVALID_CREDENTIALS';
        errorMessage = 'Incorrect email or password.';
      } else if (rawError.includes('user not found') || rawError.includes('user_not_found')) {
        errorCode = 'USER_NOT_FOUND';
        errorMessage = 'User account not found.';
      } else if (rawError.includes('session expired') || rawError.includes('session_expired')) {
        errorCode = 'SESSION_EXPIRED';
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (rawError.includes('too short') || rawError.includes('too_short') || rawError.includes('password length')) {
        errorCode = 'PASSWORD_TOO_SHORT';
        errorMessage = 'Password is too short. Minimum length is 8 characters.';
      } else if (rawError.includes('invalid email') || rawError.includes('invalid_email') || rawError.includes('email format')) {
        errorCode = 'INVALID_EMAIL';
        errorMessage = 'Invalid email address format.';
      }

      return reply.send({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          details: bodyJSON
        }
      });
    }

    return reply.send({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: bodyText || 'Authentication failed.'
      }
    });
  } catch (error: any) {
    request.log.error(error as Error, 'Authentication Error');
    
    // Cek jika error terjadi karena masalah database Prisma
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

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_AUTH_ERROR',
        message: 'An internal error occurred during the authentication process.',
        details: error.message
      }
    });
  }
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Endpoint Registrasi (Sign Up)
  fastify.post('/sign-up/email', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute'
      }
    },
    schema: signUpSchema
  }, handleBetterAuth);

  // 2. Endpoint Login (Sign In)
  fastify.post('/sign-in/email', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    },
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
