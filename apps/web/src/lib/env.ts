// Validation of the security-critical environment. Runs once per server
// process (from instrumentation.ts), never at build time.
//
// Only two settings are fatal in production: without a real AUTH_SECRET the
// session JWTs are forgeable — which means anyone can mint an admin session —
// and without DATABASE_URL nothing works at all. Everything else degrades
// gracefully and is reported as a warning so a running deployment is never
// taken down over an optional integration.

const PLACEHOLDERS = new Set([
  "",
  "replace-me",
  "replace-me-with-a-random-secret",
  "changeme",
  "secret",
]);

function isPlaceholder(v: string | undefined): boolean {
  return !v || PLACEHOLDERS.has(v.trim().toLowerCase());
}

let checked = false;

export function assertServerEnv(): void {
  if (checked) return;
  checked = true;

  const isProd = process.env.NODE_ENV === "production";
  const fatal: string[] = [];
  const warnings: string[] = [];

  if (!process.env.DATABASE_URL) fatal.push("DATABASE_URL fehlt.");

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (isPlaceholder(secret)) {
    fatal.push("AUTH_SECRET fehlt oder ist noch der Platzhalter (openssl rand -base64 33).");
  } else if ((secret as string).length < 32) {
    fatal.push("AUTH_SECRET ist zu kurz (mindestens 32 Zeichen).");
  }

  if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
    warnings.push("AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET fehlen — Google-Login ist nicht nutzbar.");
  }
  if (!process.env.ADMIN_EMAILS?.trim()) {
    warnings.push("ADMIN_EMAILS ist leer — kein Bootstrap-Admin kann sich anmelden.");
  }

  // An internal calendar feed behind a guessable token is worse than none, so
  // the route rejects short/placeholder tokens outright — say so here.
  const feedToken = process.env.CALENDAR_FEED_TOKEN;
  if (feedToken !== undefined && (isPlaceholder(feedToken) || feedToken.length < 16)) {
    warnings.push(
      "CALENDAR_FEED_TOKEN ist ein Platzhalter oder zu kurz (min. 16 Zeichen) — " +
        "der interne Kalender-Feed bleibt deaktiviert.",
    );
  }

  if (process.env.SLACK_BOT_TOKEN && !process.env.SLACK_SIGNING_SECRET) {
    warnings.push(
      "SLACK_BOT_TOKEN gesetzt, aber SLACK_SIGNING_SECRET fehlt — Slack-Interaktionen werden abgelehnt.",
    );
  }

  for (const w of warnings) console.warn(`[env] ${w}`);

  if (fatal.length) {
    const message = `Unsichere Konfiguration:\n  - ${fatal.join("\n  - ")}`;
    if (isProd) throw new Error(message);
    console.warn(`[env] ${message}`);
  }
}
