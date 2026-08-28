# SV-Platform

Selbst gehostete Plattform der **Schülervertretung der Freien Waldorfschule
Frankfurt am Main** – ersetzt den bisherigen Google-Drive-Sync, die
`termine.txt` und die Firestore-Aufgaben durch **eine PostgreSQL-Datenbank** und
ergänzt Login, Admin-Panel, direkten PDF-Upload, einen geteilten Kalender, einen
Drive-Freigabe-Flow und ein **smartes Mail-System**.

## Was drin ist

| Bereich | Beschreibung |
|--------|--------------|
| **Öffentlich** | Protokoll-Archiv (PDF), Termine (+ iCal-Abo), Themen-Einreichung, Drive-Zugang anfragen |
| **SV-intern** (Login) | Dashboard, Aufgaben, Mail-Posteingang, interne Dokumente, Kalender |
| **Admin** (Login) | PDF-Upload, Termine, Rollen/Ämter, Themen, Drive-Freigaben, Nutzerverwaltung, Mail-Routing |
| **mail-brain** | IMAP-Postfach → KI-Klassifikation (OpenAI) → Routing an das zuständige Amt → Slack → Eskalation |

## Architektur

- **`apps/web`** — Next.js 16 (App Router), Auth.js (Google-OAuth), Tailwind v4.
- **`apps/mail-brain`** — Node-Worker (imapflow + OpenAI + Slack), läuft eigenständig.
- **`packages/db`** — Prisma-Schema + Client + Seed (die einzige Datenquelle).
- **`packages/core`** — geteilte Typen, Termine-Parser, Rollen-Wissensbasis.
- **`infra`** — Caddy (Auto-HTTPS), Deploy-/Backup-Skripte, CI-Vorlagen.

Domain-Layout: `sv-fwsffm.de` → SV-FFM-Homepage (statisch), `archiv.sv-fwsffm.de`
→ diese App. Details in **[DEPLOY.md](./DEPLOY.md)**, Kosten in **[COSTS.md](./COSTS.md)**.

## Lokal starten

Voraussetzungen: Docker, Node ≥ 20, pnpm 9.

```bash
cp .env.example .env            # AUTH_SECRET setzen: openssl rand -base64 33
pnpm install
docker compose up -d postgres   # Datenbank
pnpm db:migrate                 # Schema anlegen
pnpm db:seed                    # vorhandene Protokolle/Termine importieren
pnpm dev                        # http://localhost:3000
```

**Ohne Google-Login testen:** Im Dev-Modus bietet `/login` einen „Dev-Login" –
melde dich mit einer E-Mail aus `ADMIN_EMAILS` an (Standard:
`bahriannovotny@icloud.com`). Dieser Login existiert in Produktion nicht.

**Mail-Pipeline testen (ohne Postfach/OpenAI/Slack):**

```bash
pnpm --filter @sv/mail-brain test:pipeline
```

Zwei Beispiel-Mails werden klassifiziert, geroutet und landen im Posteingang
(`/intern/mails`) – über einen Schlagwort-Klassifikator, falls kein
`OPENAI_API_KEY` gesetzt ist.

## Nützliche Skripte

| Befehl | Wirkung |
|--------|---------|
| `pnpm dev` | Web-App im Dev-Modus |
| `pnpm build` / `pnpm typecheck` | Bauen / Typprüfung (alle Pakete) |
| `pnpm db:studio` | Prisma Studio (DB-GUI) |
| `pnpm db:reset` | DB zurücksetzen + neu seeden |

> Nichts hiervon wird automatisch deployt. Deployment erfolgt erst nach der
> IONOS-Registrierung gemäß **[DEPLOY.md](./DEPLOY.md)**.
