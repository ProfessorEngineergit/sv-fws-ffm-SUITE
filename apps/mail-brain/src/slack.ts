import { WebClient } from "@slack/web-api";
import { config } from "./config";

/**
 * Escape text Slack renders as mrkdwn. Subject, sender and AI summary all
 * originate from inbound mail, so an attacker could otherwise inject a
 * "<!channel>" ping or a fake link into every notification.
 */
function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let client: WebClient | null = null;
function getClient(): WebClient | null {
  if (!config.slackToken) return null;
  if (!client) client = new WebClient(config.slackToken);
  return client;
}

export interface MailNotice {
  id: string;
  subject: string | null;
  fromAddr: string;
  category: string;
  urgency: string;
  assignedRole: string;
  assignedSlackId?: string | null;
  summary: string;
  escalated?: boolean;
}

export async function notifyMail(n: MailNotice): Promise<string | null> {
  const cl = getClient();
  if (!cl) return null;
  const head = n.escalated ? "⏰ *ESKALATION* – unbearbeitete Mail" : "📨 Neue Mail";
  // Only a well-formed Slack ID may become a real mention.
  const slackId = /^[A-Z0-9]{2,32}$/i.test(n.assignedSlackId ?? "") ? n.assignedSlackId : null;
  const mention = slackId ? ` (<@${slackId}>)` : "";
  const subject = esc(n.subject ?? "(kein Betreff)");
  const text = `${head}: ${subject} → ${esc(n.assignedRole)}`;
  try {
    const res = await cl.chat.postMessage({
      channel: config.slackChannel,
      text,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `${head}\n\n*${subject}*\n` +
              `Von: ${esc(n.fromAddr)}\n` +
              `*Kategorie:* ${esc(n.category)}  ·  *Dringlichkeit:* ${esc(n.urgency)}\n` +
              `*Zuständig:* ${esc(n.assignedRole)}${mention}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: n.summary ? esc(n.summary) : "_(keine Zusammenfassung)_",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Erledigt ✓" },
              style: "primary",
              action_id: "ack_mail",
              value: n.id,
            },
          ],
        },
      ],
    });
    return (res.ts as string) ?? null;
  } catch (e) {
    console.warn("[slack] notifyMail failed:", (e as Error).message);
    return null;
  }
}
