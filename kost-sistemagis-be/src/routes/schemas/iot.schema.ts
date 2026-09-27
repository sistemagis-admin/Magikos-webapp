// src/routes/schemas/iot.schema.ts
import { standardErrorResponses } from './common.schema';

export const manualOpenDoorSchema = {
  tags: ['IoT'],
  summary: 'Trigger manual door unlock via MQTT',
  description: 'Sends an MQTT open command to the designated door controller hardware. Requires manage permission on IoT.',
  body: {
    type: 'object',
    properties: {
      rfidTag: { type: 'string', description: 'Simulated or registered RFID tag string identifier' },
      kostId: { type: 'string', description: 'Kost building ID where door is located' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            rfidTag: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    ...standardErrorResponses
  }
};
