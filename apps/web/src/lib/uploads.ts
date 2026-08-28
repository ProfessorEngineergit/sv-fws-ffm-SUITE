import path from "node:path";
import { existsSync, promises as fs } from "node:fs";

// Resolve UPLOADS_DIR. Absolute in Docker (/var/sv/uploads); for local dev the
// relative "./data-uploads" is resolved against the monorepo root so it matches
// wherever the seed wrote the files, regardless of the process cwd.
function findRepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

export function uploadsDir(): string {
  const raw = process.env.UPLOADS_DIR || "./data-uploads";
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(findRepoRoot(process.cwd()), raw);
}

/** Read a file inside the uploads dir, guarding against path traversal. */
export async function readUpload(relPath: string): Promise<Buffer> {
  const base = path.resolve(uploadsDir());
  const resolved = path.resolve(base, relPath);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error("invalid upload path");
  }
  return fs.readFile(resolved);
}

/** Persist an uploaded file (used by the admin PDF upload). */
export async function writeUpload(relPath: string, data: Buffer): Promise<string> {
  const base = path.resolve(uploadsDir());
  const resolved = path.resolve(base, relPath);
  if (!resolved.startsWith(base + path.sep)) throw new Error("invalid upload path");
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, data);
  return relPath;
}

export async function deleteUpload(relPath: string): Promise<void> {
  const base = path.resolve(uploadsDir());
  const resolved = path.resolve(base, relPath);
  if (!resolved.startsWith(base + path.sep)) return;
  await fs.rm(resolved, { force: true });
}
