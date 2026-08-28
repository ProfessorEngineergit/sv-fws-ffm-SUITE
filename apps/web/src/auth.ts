// Full (Node) auth instance: adds the Prisma adapter + the DB-backed whitelist.
// Imported only from server components, server actions and the auth route —
// never from middleware.
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@sv/db";
import { authConfig } from "@/auth.config";
import { isAdminEmail } from "@/lib/adminEmails";

const devLogin =
  process.env.NODE_ENV !== "production"
    ? [
        // Local-only: sign in with just an email. Never available in production.
        Credentials({
          id: "dev",
          name: "Dev-Login",
          credentials: { email: { label: "E-Mail", type: "email" } },
          authorize: async (creds) => {
            const email = String(creds?.email ?? "").toLowerCase().trim();
            if (!email) return null;
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
              if (!isAdminEmail(email)) return null; // only admins may bootstrap
              user = await prisma.user.create({
                data: { email, name: email.split("@")[0], role: "ADMIN" },
              });
            } else if (isAdminEmail(email) && user.role !== "ADMIN") {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { role: "ADMIN" },
              });
            }
            return {
              id: user.id,
              email: user.email,
              name: user.name ?? undefined,
              role: user.role,
            };
          },
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [...authConfig.providers, ...devLogin],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // The dev credentials provider already validated the user in authorize().
      if (account?.provider === "dev") return true;
      const email = user.email?.toLowerCase();
      if (!email) return false;
      if (isAdminEmail(email)) return true; // bootstrap admins always allowed
      const existing = await prisma.user.findUnique({ where: { email } });
      return Boolean(existing); // only pre-provisioned members
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id && isAdminEmail(user.email)) {
        await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      }
    },
    async signIn({ user }) {
      if (user?.id && isAdminEmail(user.email)) {
        await prisma.user
          .update({ where: { id: user.id }, data: { role: "ADMIN" } })
          .catch(() => {});
      }
    },
  },
});
