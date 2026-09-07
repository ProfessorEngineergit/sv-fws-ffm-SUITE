/** Read a positive number from the environment, falling back on bad input. */
function numberEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) {
    console.warn(`[config] ${name}="${raw}" ist ungültig — nutze ${fallback}.`);
    return fallback;
  }
  return n;
}

export const config = {
  enabled: process.env.MAILBRAIN_ENABLED === "true",
  imap: {
    host: process.env.IMAP_HOST ?? "",
    port: numberEnv("IMAP_PORT", 993, 1, 65535),
    user: process.env.IMAP_USER ?? "",
    pass: process.env.IMAP_PASSWORD ?? "",
  },
  // Never poll faster than every 10s, so a typo cannot hammer the mail server.
  pollMs: numberEnv("MAIL_POLL_INTERVAL_MS", 180_000, 10_000, 24 * 3_600_000),
  escalationHours: numberEnv("ESCALATION_HOURS", 4, 0.5, 24 * 30),
  openaiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  slackToken: process.env.SLACK_BOT_TOKEN ?? "",
  slackChannel: process.env.SLACK_INBOX_CHANNEL ?? "#eingang",
};

export function imapConfigured(): boolean {
  return Boolean(config.imap.host && config.imap.user && config.imap.pass);
}
