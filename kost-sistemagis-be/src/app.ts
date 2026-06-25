// src/app.ts
import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import databasePlugin from './plugins/database';
import mqttPlugin from './plugins/mqtt';
import authRoutes from './routes/auth.route';
import dashboardRoutes from './routes/api/v1/dashboard.route';
import paymentRoutes from './routes/api/v1/payment.route';
import iotRoutes from './routes/api/v1/iot.route';
import userRoutes from './routes/api/v1/user.route';
import roleRoutes from './routes/api/v1/role.route';
import permissionRoutes from './routes/api/v1/permission.route';
import roomRoutes from './routes/api/v1/room.route';
import residentRoutes from './routes/api/v1/resident.route';
import { env } from './config/env';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = fastify(opts);

  // Global Error Handler
  app.setErrorHandler((error: any, request, reply) => {
    // Tangani validasi fastify bawaan
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid request payload',
          details: error.validation
        }
      });
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    
    // Jangan terekspos error internal di production
    const isInternalError = statusCode === 500;
    const message = isInternalError && env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : error.message;

    if (isInternalError) {
      app.log.error(error);
    }

    return reply.status(statusCode).send({
      success: false,
      error: {
        code: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'API_ERROR',
        message: message
      }
    });
  });

  // Security Middlewares
  app.register(fastifyHelmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  app.register(fastifyCors, {
    origin: env.NODE_ENV === 'production' ? ['https://namadomainfrontend.com'] : true,
    credentials: true
  });

  // Global Rate Limiter
  app.register(fastifyRateLimit, {
    max: 100, // max requests
    timeWindow: '1 minute' // per minute
  });

  // Registrasi Swagger untuk Dokumentasi Otomatis
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'KosMonitor API Documentation',
        description: 'Dokumentasi API Otomatis untuk Dashboard Manajemen Kos Sistemagis',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}`
        }
      ]
    }
  });

  app.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // Registrasi Plugin
  app.register(databasePlugin);
  app.register(mqttPlugin);

  // Registrasi Routes
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
  app.register(paymentRoutes, { prefix: '/api/v1/payment' });
  app.register(iotRoutes, { prefix: '/api/v1/iot' });
  app.register(userRoutes, { prefix: '/api/v1/users' });
  app.register(roleRoutes, { prefix: '/api/v1/roles' });
  app.register(permissionRoutes, { prefix: '/api/v1/permissions' });
  app.register(roomRoutes, { prefix: '/api/v1/rooms' });
  app.register(residentRoutes, { prefix: '/api/v1/residents' });

  return app;
}

export default buildApp;
