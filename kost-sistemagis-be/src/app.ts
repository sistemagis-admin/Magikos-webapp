// src/app.ts
import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import databasePlugin from './plugins/database';
import mqttPlugin from './plugins/mqtt';
import authRoutes from './routes/auth.route';
import paymentRoutes from './routes/api/v1/payment.route';
import iotRoutes from './routes/api/v1/iot.route';

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = fastify(opts);

  // Registrasi Plugin
  app.register(databasePlugin);
  app.register(mqttPlugin);

  // Registrasi Routes
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(paymentRoutes, { prefix: '/api/v1/payment' });
  app.register(iotRoutes, { prefix: '/api/v1/iot' });

  return app;
}

export default buildApp;
