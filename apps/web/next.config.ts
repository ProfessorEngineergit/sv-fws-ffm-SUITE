import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Self-hosted: emit a standalone server (used by the Docker image).
  output: "standalone",
  // Trace files from the monorepo root so workspace packages are bundled.
  outputFileTracingRoot: path.join(here, "../../"),
  // Compile the workspace TS packages.
  transpilePackages: ["@sv/core", "@sv/db"],
  // Keep the Prisma engine out of the bundle (native binary, loaded at runtime).
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
