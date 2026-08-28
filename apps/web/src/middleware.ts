// Route protection. Uses only the edge-safe config (no Prisma). The `authorized`
// callback in auth.config.ts decides access; unauthenticated users are sent to
// the sign-in page.
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Default-export the middleware function (Turbopack detects this reliably).
export default auth;

export const config = {
  matcher: ["/intern/:path*", "/admin/:path*"],
};
