import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";

/**
 * form-action is enforced against redirect targets, so a sign-in that lands on
 * a configured origin different from the one the browser is on would be blocked
 * outright. Naming the app's own configured origins keeps the directive strict
 * without ever locking anyone out of the login.
 */
function configuredOrigins(): string[] {
  const origins = new Set<string>();
  for (const raw of [process.env.AUTH_URL, process.env.NEXTAUTH_URL, process.env.APP_URL]) {
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      /* ignore malformed values */
    }
  }
  return [...origins];
}

// Next injects inline bootstrap/hydration scripts and Tailwind emits inline
// styles, so 'unsafe-inline' is required for the app to run; the value of the
// policy here is locking every other origin out (no third-party scripts, no
// framing by foreign sites, no plugins). Dev additionally needs 'unsafe-eval'
// for React Refresh and websocket connections for HMR.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  // Google's consent screen is reached through a top-level redirect after a
  // same-origin form POST; naming it keeps the sign-in flow working.
  ["form-action 'self' https://accounts.google.com", ...configuredOrigins()].join(" "),
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Only meaningful over TLS; Caddy terminates HTTPS in production.
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // Self-hosted: emit a standalone server (used by the Docker image).
  output: "standalone",
  // Trace files from the monorepo root so workspace packages are bundled.
  outputFileTracingRoot: path.join(here, "../../"),
  // Compile the workspace TS packages.
  transpilePackages: ["@sv/core", "@sv/db"],
  // Keep the Prisma engine out of the bundle (native binary, loaded at runtime).
  serverExternalPackages: ["@prisma/client"],
  // Don't advertise the framework version to scanners.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
