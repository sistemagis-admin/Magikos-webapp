/**
 * Converts Fastify / Node.js IncomingHttpHeaders to standard Web Fetch Headers
 * without requiring the ESM-only "better-auth/node" package.
 */
export function toWebHeaders(headers: Record<string, string | string[] | undefined>): Headers {
  const webHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => webHeaders.append(key, v));
      } else {
        webHeaders.set(key, String(value));
      }
    }
  }
  return webHeaders;
}
