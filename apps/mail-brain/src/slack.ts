import { WebClient } from "@slack/web-api";
import { config } from "./config";

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
  const mention = n.assignedSlackId ? ` (<@${n.assignedSlackId}>)` : "";
  const text = `${head}: ${n.subject ?? "(kein Betreff)"} → ${n.assignedRole}`;
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
              `${head}\n\n*${n.subject ?? "(kein Betreff)"}*\n` +
              `Von: ${n.fromAddr}\n` +
              `*Kategorie:* ${n.category}  ·  *Dringlichkeit:* ${n.urgency}\n` +
              `*Zuständig:* ${n.assignedRole}${mention}`,
          },
        },
        { type: "section", text: { type: "mrkdwn", text: n.summary || "_(keine Zusammenfassung)_" } },
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
