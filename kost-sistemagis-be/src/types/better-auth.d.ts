// Fix untuk TS 5.0+ dengan moduleResolution "node" yang gagal membaca "exports" package.json
declare module 'better-auth/node' {
  export function fromNodeHeaders(headers: any): any;
  export function toNodeHandler(handler: any): any;
}
