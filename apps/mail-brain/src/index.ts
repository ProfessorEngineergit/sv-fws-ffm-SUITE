import { prisma } from "@sv/db";
import { config, imapConfigured } from "./config";
import { pollImap } from "./imap";
import { runEscalation } from "./escalation";
import { ingestMail } from "./ingest";

const TEST = process.argv.includes("--test");
const ONCE = process.argv.includes("--once");

async function testRun() {
  console.log("[mail-brain] test mode — injecting sample mails through the pipeline");
  const samples = [
    {
      messageId: `test-fin-${Date.now()}`,
      fromAddr: "familie.muster@example.com",
      fromName: "Familie Muster",
      subject: "Rechnung für den Kuchenbasar",
      receivedAt: new Date(),
      bodyText:
        "Hallo liebe SV, anbei die Rechnung über 45€ für die Zutaten des Kuchenbasars. " +
        "Bitte überweist den Betrag an den Förderverein. Vielen Dank und viele Grüße!",
    },
    {
      messageId: `test-ver-${Date.now()}`,
      fromAddr: "schulbuero@example.com",
      fromName: "Schulbüro",
      subject: "Sommerfest am 12.07.",
      receivedAt: new Date(),
      bodyText:
        "Wir planen das Sommerfest am 12.07.2026 um 15:00 Uhr auf dem Schulhof. " +
        "Kann die SV dort einen Stand übernehmen?",
    },
  ];
  for (const s of samples) {
    const r = await ingestMail(s);
    console.log(`  → "${s.subject}" ⇒ ${r.category} / ${r.assignedRole} (skipped=${r.skipped})`);
  }
}

async function tick() {
  if (!imapConfigured()) return;
  try {
    const n = await pollImap();
    if (n) console.log(`[mail-brain] processed ${n} new mail(s)`);
  } catch (e) {
    console.warn("[mail-brain] poll error:", (e as Error).message);
  }
}

async function main() {
  console.log(
    `[mail-brain] start — enabled=${config.enabled} imap=${imapConfigured()} ` +
      `openai=${Boolean(config.openaiKey)} slack=${Boolean(config.slackToken)}`,
  );

  if (TEST) {
    await testRun();
    await prisma.$disconnect();
    return;
  }

  if (!config.enabled) {
    console.log("[mail-brain] MAILBRAIN_ENABLED != true → idle. Set env + creds to activate.");
    setInterval(() => {}, 1 << 30); // keep the container alive
    return;
  }

  await tick();
  if (ONCE) {
    await prisma.$disconnect();
    return;
  }

  setInterval(tick, config.pollMs);
  setInterval(
    () => {
      runEscalation()
        .then((n) => n && console.log(`[mail-brain] escalated ${n} mail(s)`))
        .catch((e) => console.warn("[mail-brain] escalation error:", e.message));
    },
    3_600_000,
  );
}

main().catch((e) => {
  console.error("[mail-brain] fatal:", e);
  process.exit(1);
});
