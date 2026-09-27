import { app } from '../server';

const handler = async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};

export default handler;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  (module.exports as any).default = handler;
}
