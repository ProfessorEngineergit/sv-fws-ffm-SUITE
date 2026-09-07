// Route protection (Next 16 renamed the middleware convention to "proxy").
// Uses only the edge-safe config (no Prisma). The `authorized` callback in
// auth.config.ts decides access; unauthenticated users are sent to the sign-in
// page. Authority is re-checked against the database in every server component
// and action via lib/session.ts — this layer only keeps anonymous traffic out.
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Default-export the proxy function (Turbopack detects this reliably).
export default auth;

export const config = {
  matcher: ["/intern/:path*", "/admin/:path*"],
};
