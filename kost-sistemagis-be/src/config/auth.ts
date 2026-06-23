import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../plugins/database";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET || "a-very-secure-secret-key-of-at-least-32-chars",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
});
