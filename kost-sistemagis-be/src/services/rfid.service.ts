// src/services/rfid.service.ts
import { FastifyInstance } from 'fastify';

export class RfidService {
  constructor(private fastify: FastifyInstance) {}

  async openMainDoor(rfidTag: string): Promise<{ success: boolean; message: string }> {
    this.fastify.log.info(`Validating RFID: ${rfidTag}`);
    
    const topic = 'kos/pintu/utama/buka';
    const message = JSON.stringify({ tag: rfidTag, action: 'open', timestamp: Date.now() });
    
    if (this.fastify.mqtt) {
      this.fastify.mqtt.publish(topic, message, () => {
        this.fastify.log.info(`MQTT message published to topic ${topic}`);
      });
      return { success: true, message: 'Pintu berhasil dibuka' };
    } else {
      this.fastify.log.error('MQTT client is not connected');
      throw new Error('MQTT integration failed');
    }
  }
}
