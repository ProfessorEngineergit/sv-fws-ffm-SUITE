// Edge-safe auth configuration shared by middleware and the Node auth instance.
// MUST NOT import Prisma or Node-only modules — middleware bundles this for the
// edge runtime.
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/adminEmails";

export const authConfig = {
  providers: [Google],
  // Behind the Caddy reverse proxy in prod; in dev the request host is used.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role ?? "MEMBER";
      }
      // Env-based admin elevation is edge-safe and covers first-login bootstrap.
      if (isAdminEmail(token.email)) token.role = "ADMIN";
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string | undefined) ?? session.user.id;
        session.user.role = (token.role as "ADMIN" | "MEMBER" | undefined) ?? "MEMBER";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;
      if (pathname.startsWith("/admin")) return role === "ADMIN";
      if (pathname.startsWith("/intern")) return role === "ADMIN" || role === "MEMBER";
      return true;
    },
  },
} satisfies NextAuthConfig;
