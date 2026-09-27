import { buildApp } from '../src/app';

let appInstance: any = null;

async function getApp() {
  if (!appInstance) {
    appInstance = buildApp({
      logger: false
    });
    await appInstance.ready();
  }
  return appInstance;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  app.server.emit('request', req, res);
}
