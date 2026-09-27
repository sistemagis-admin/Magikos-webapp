// server.ts
import { buildApp } from './src/app';
import { env } from './src/config/env';

export const app = buildApp({
  logger: {
    level: 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token']
  }
});

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Server is running on http://${env.HOST}:${env.PORT}`);
    
    // Pesan tambahan yang lebih mudah dibaca (Human-readable)
    console.log('\n======================================================');
    console.log('🚀 Server Manajemen Kos Sistemagis');
    console.log(`🌐 URL Endpoint: http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}`);
    console.log('======================================================\n');
  } catch (err) {
    app.log.error(err);
    
    // Pesan error yang lebih jelas
    console.error('\n======================================================');
    console.error('❌ Server mengalami masalah saat dinyalakan.');
    console.error('Detail Error:', err);
    console.error('======================================================\n');
    
    process.exit(1);
  }
};

// Start listening: Vercel intercepts this call in production (Fluid Compute) to route traffic
start();

const handler = async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};

// Support both CommonJS require() and ES Module default import on Vercel
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  (module.exports as any).default = handler;
  (module.exports as any).app = app;
}

export default handler;

