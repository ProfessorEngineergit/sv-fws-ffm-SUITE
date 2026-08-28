export const config = {
  enabled: process.env.MAILBRAIN_ENABLED === "true",
  imap: {
    host: process.env.IMAP_HOST ?? "",
    port: Number(process.env.IMAP_PORT ?? 993),
    user: process.env.IMAP_USER ?? "",
    pass: process.env.IMAP_PASSWORD ?? "",
  },
  pollMs: Number(process.env.MAIL_POLL_INTERVAL_MS ?? 180_000),
  escalationHours: Number(process.env.ESCALATION_HOURS ?? 4),
  openaiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  slackToken: process.env.SLACK_BOT_TOKEN ?? "",
  slackChannel: process.env.SLACK_INBOX_CHANNEL ?? "#eingang",
};

export function imapConfigured(): boolean {
  return Boolean(config.imap.host && config.imap.user && config.imap.pass);
}
