// Thin Slack helper for the web app. No-ops gracefully when SLACK_BOT_TOKEN is
// unset, so the platform runs before a Slack workspace exists.
import { WebClient } from "@slack/web-api";
import type { KnownBlock } from "@slack/web-api";

/**
 * Escape text that Slack renders as mrkdwn. Values coming from public forms
 * must never be able to produce a mention ("<!channel>", "<@U…>") or a link.
 */
export function escapeSlack(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let client: WebClient | null = null;

function getClient(): WebClient | null {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  if (!client) client = new WebClient(token);
  return client;
}

export function slackEnabled(): boolean {
  return Boolean(process.env.SLACK_BOT_TOKEN);
}

export async function postToInbox(
  text: string,
  blocks?: KnownBlock[],
): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  const channel = process.env.SLACK_INBOX_CHANNEL || "#eingang";
  try {
    const res = await c.chat.postMessage({ channel, text, blocks });
    return (res.ts as string) ?? null;
  } catch (e) {
    console.warn("[slack] postToInbox failed:", (e as Error).message);
    return null;
  }
}

export async function notifyDriveAccessRequest(req: {
  email: string;
  requesterRole?: string | null;
  reason?: string | null;
}): Promise<void> {
  const role = req.requesterRole ? ` (${escapeSlack(req.requesterRole)})` : "";
  const reason = req.reason ? `\n> ${escapeSlack(req.reason)}` : "";
  await postToInbox(
    `📁 Neue Zugriffsanfrage auf SV-Dokumente von *${escapeSlack(req.email)}*${role}.${reason}\nBitte im Admin-Panel unter „Zugang" prüfen.`,
  );
}
