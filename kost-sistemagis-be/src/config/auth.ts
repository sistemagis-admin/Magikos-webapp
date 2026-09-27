import { prisma } from "../plugins/database";
import { env } from "./env";

// Helper to perform true native ESM dynamic import in TypeScript CommonJS runtime
const dynamicImport = new Function('specifier', 'return import(specifier)') as <T = any>(specifier: string) => Promise<T>;

// Static hints for Vercel Node File Trace (NFT) to bundle ESM packages
if (false as boolean) {
  require.resolve('better-auth');
  require.resolve('better-auth/adapters/prisma');
  require.resolve('better-auth/plugins');
}

let authInstance: any = null;

export async function getAuth() {
  if (!authInstance) {
    const [{ betterAuth }, { prismaAdapter }, { admin, bearer }] = await Promise.all([
      dynamicImport("better-auth"),
      dynamicImport("better-auth/adapters/prisma"),
      dynamicImport("better-auth/plugins")
    ]);

    authInstance = betterAuth({
      database: prismaAdapter(prisma, {
        provider: "postgresql",
      }),
      plugins: [
        admin(),
        bearer()
      ],
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-client-id",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-client-secret",
        },
        github: {
          clientId: process.env.GITHUB_CLIENT_ID || "placeholder-client-id",
          clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder-client-secret",
        },
      },
      emailAndPassword: {
        enabled: true,
      },
      advanced: {
        disableCSRFCheck: true,
      },
      trustedOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://magikos-webapp.vercel.app',
        ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
        ...(Array.isArray(env.CORS_ORIGIN) ? env.CORS_ORIGIN : [env.CORS_ORIGIN])
      ],
    });
  }
  return authInstance;
}

export const auth: any = new Proxy({}, {
  get(target, prop) {
    if (authInstance) {
      return authInstance[prop];
    }
    throw new Error(`Auth accessed before initialization. Please use await getAuth() instead.`);
  }
});

