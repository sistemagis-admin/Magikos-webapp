// Fix untuk IDE TypeScript (VSCode) yang terkadang gagal mendeteksi deklarasi tipe bawaan
declare module '@fastify/swagger-ui' {
  import { FastifyPluginCallback } from 'fastify';
  const fastifySwaggerUi: FastifyPluginCallback<any>;
  export default fastifySwaggerUi;
}
