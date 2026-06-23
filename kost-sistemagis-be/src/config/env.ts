// src/config/env.ts
export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  MQTT_URL: process.env.MQTT_URL || 'mqtt://test.mosquitto.org'
};
