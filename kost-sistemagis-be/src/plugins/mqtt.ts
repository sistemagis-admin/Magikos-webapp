// src/plugins/mqtt.ts
import fp from 'fastify-plugin';
import mqtt, { MqttClient } from 'mqtt';
import { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    mqtt: MqttClient;
  }
}

const mqttPlugin: FastifyPluginAsync = async (fastify, options) => {
  const client = mqtt.connect(env.MQTT_URL);

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
};

export default fp(mqttPlugin);
