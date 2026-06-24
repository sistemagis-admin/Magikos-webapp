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
import { env } from './config/env';

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = fastify(opts);

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

  return app;
}

export default buildApp;
