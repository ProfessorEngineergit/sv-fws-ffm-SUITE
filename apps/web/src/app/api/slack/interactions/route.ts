import crypto from "node:crypto";
import { prisma } from "@sv/db";

export const dynamic = "force-dynamic";

function verifySignature(sig: string | null, ts: string | null, body: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !sig || !ts) return false;
  // Reject requests older than 5 minutes (replay protection).
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const expected = "v0=" + crypto.createHmac("sha256", secret).update(`v0:${ts}:${body}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-slack-signature");
  const ts = req.headers.get("x-slack-request-timestamp");
  if (!verifySignature(sig, ts, raw)) {
    return new Response("invalid signature", { status: 401 });
  }

  const payload = JSON.parse(new URLSearchParams(raw).get("payload") ?? "{}");
  const action = payload.actions?.[0];

  if (action?.action_id === "ack_mail" && action.value) {
    await prisma.mail
      .update({
        where: { id: action.value },
        data: { status: "done", acknowledgedAt: new Date() },
      })
      .catch(() => {});
    return Response.json({
      replace_original: true,
      text: `✓ Erledigt – bearbeitet von <@${payload.user?.id ?? "jemandem"}>.`,
    });
  }

  return new Response("", { status: 200 });
}
