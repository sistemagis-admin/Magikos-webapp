// src/plugins/mqtt.ts
import fp from 'fastify-plugin';
import mqtt, { MqttClient } from 'mqtt';
import { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    mqtt: MqttClient | null;
  }
}

const mqttPlugin: FastifyPluginAsync = async (fastify, options) => {
  if (!env.ENABLE_MQTT) {
    fastify.log.info('MQTT is currently disabled (ENABLE_MQTT=false). Running IoT features in mock/simulation mode.');
    fastify.decorate('mqtt', null);
    return;
  }

  try {
    const client = mqtt.connect(env.MQTT_URL, {
      connectTimeout: 5000,
      reconnectPeriod: 10000,
    });

    client.on('connect', () => {
      fastify.log.info(`Connected to MQTT broker at ${env.MQTT_URL}`);
    });

    client.on('error', (err: Error) => {
      fastify.log.error(`MQTT Connection error: ${err.message}`);
    });

    fastify.decorate('mqtt', client);

    fastify.addHook('onClose', (instance, done) => {
      client.end();
      done();
    });
  } catch (err) {
    fastify.log.warn(`Could not connect to MQTT broker: ${err}. Falling back to simulation mode.`);
    fastify.decorate('mqtt', null);
  }
};

export default fp(mqttPlugin);
