import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { config } from "./config";
import { ingestMail } from "./ingest";

/** Fetch unseen INBOX messages, run each through the pipeline, mark as seen. */
export async function pollImap(): Promise<number> {
  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: true,
    auth: { user: config.imap.user, pass: config.imap.pass },
    logger: false,
  });

  await client.connect();
  let processed = 0;
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const msg of client.fetch({ seen: false }, { source: true, uid: true })) {
        try {
          const parsed = await simpleParser(msg.source as Buffer);
          const from = parsed.from?.value?.[0];
          await ingestMail({
            messageId: parsed.messageId || `imap-${msg.uid}-${Date.now()}`,
            fromAddr: from?.address ?? "unbekannt",
            fromName: from?.name || null,
            subject: parsed.subject ?? null,
            receivedAt: parsed.date ?? new Date(),
            bodyText:
              parsed.text ??
              (parsed.html ? String(parsed.html).replace(/<[^>]+>/g, " ") : ""),
          });
          await client.messageFlagsAdd(msg.uid, ["\\Seen"], { uid: true });
          processed++;
        } catch (e) {
          console.warn("[imap] message failed:", (e as Error).message);
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
  return processed;
}
