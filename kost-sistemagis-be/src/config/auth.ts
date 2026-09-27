import { prisma } from "../plugins/database";
import { env } from "./env";

let authInstance: any = null;

export async function getAuth() {
  if (!authInstance) {
    const [{ betterAuth }, { prismaAdapter }, { admin, bearer }] = await Promise.all([
      import("better-auth"),
      import("better-auth/adapters/prisma"),
      import("better-auth/plugins")
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
        disableCSRFCheck: env.NODE_ENV !== "production",
      },
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

