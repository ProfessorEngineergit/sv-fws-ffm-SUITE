// Small in-memory sliding-window rate limiter. Guards the unauthenticated
// public actions (Themen-Einreichung, Zugangsanfrage) against spam and
// automated abuse. Single-instance by design — the platform runs one web
// container; a restart simply clears the window.
import { headers } from "next/headers";

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();
const MAX_BUCKETS = 5_000;

function sweep(now: number) {
  for (const [key, hit] of buckets) {
    if (hit.resetAt <= now) buckets.delete(key);
  }
  // Hard cap so a flood of distinct keys cannot grow the map without bound.
  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS;
    let i = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++i >= excess) break;
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/** Allow at most `limit` events per `windowMs` for the given key. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const hit = buckets.get(key);
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  hit.count++;
  if (hit.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((hit.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP. Behind the Caddy reverse proxy the real address is the
 * last entry of X-Forwarded-For (Caddy appends it), so client-supplied values
 * earlier in the list cannot be used to dodge the limit.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}
