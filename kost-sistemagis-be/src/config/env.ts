// src/config/env.ts
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const authSecret = process.env.BETTER_AUTH_SECRET || 'super-secret-key-for-development-32chars!';

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL 
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
  : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  MQTT_URL: process.env.MQTT_URL || 'mqtt://test.mosquitto.org',
  ENABLE_MQTT: process.env.ENABLE_MQTT === 'true',
  BETTER_AUTH_SECRET: authSecret,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || vercelUrl,
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : ['http://localhost:3000', 'http://localhost:5173'],
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || 'dev_payment_webhook_secret_key_123',
};

