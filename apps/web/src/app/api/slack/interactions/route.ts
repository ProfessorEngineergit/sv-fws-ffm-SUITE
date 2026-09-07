import crypto from "node:crypto";
import { prisma } from "@sv/db";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;
const MAX_SKEW_SECONDS = 300;

function verifySignature(sig: string | null, ts: string | null, body: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !sig || !ts) return false;

  // Reject requests older than 5 minutes (replay protection). A non-numeric
  // timestamp must fail closed — NaN comparisons are always false.
  const sent = Number(ts);
  if (!Number.isFinite(sent)) return false;
  if (Math.abs(Date.now() / 1000 - sent) > MAX_SKEW_SECONDS) return false;

  const expected =
    "v0=" + crypto.createHmac("sha256", secret).update(`v0:${ts}:${body}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sig, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return new Response("payload too large", { status: 413 });

  const sig = req.headers.get("x-slack-signature");
  const ts = req.headers.get("x-slack-request-timestamp");
  if (!verifySignature(sig, ts, raw)) {
    return new Response("invalid signature", { status: 401 });
  }

  let payload: {
    actions?: { action_id?: string; value?: string }[];
    user?: { id?: string };
  };
  try {
    payload = JSON.parse(new URLSearchParams(raw).get("payload") ?? "{}");
  } catch {
    return new Response("invalid payload", { status: 400 });
  }

  const action = payload.actions?.[0];
  const mailId = typeof action?.value === "string" ? action.value : "";

  if (action?.action_id === "ack_mail" && mailId && mailId.length <= 64) {
    await prisma.mail
      .update({
        where: { id: mailId },
        data: { status: "done", acknowledgedAt: new Date() },
      })
      .catch(() => {});
    // Slack user IDs are alphanumeric; keep the echo free of injected markup.
    const who = String(payload.user?.id ?? "").replace(/[^A-Za-z0-9._-]/g, "");
    return Response.json({
      replace_original: true,
      text: who ? `✓ Erledigt – bearbeitet von <@${who}>.` : "✓ Erledigt.",
    });
  }

  return new Response("", { status: 200 });
}
