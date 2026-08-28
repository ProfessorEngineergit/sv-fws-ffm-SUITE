# Deployment-Runbook (IONOS)

Diese Anleitung führt von „nichts" bis „live". Reihenfolge einhalten. Platzhalter
`sv-fwsffm.de` überall durch die echte Domain ersetzen (eine Variable: `APP_DOMAIN`).

## 0. Was du vorher brauchst
- IONOS **VPS M** (o. ä.), Ubuntu 22.04/24.04, Root-SSH.
- Eine **.de-Domain** (bei IONOS ~1 €/Jahr).
- Ein **Google-Konto** für die SV (für OAuth + Drive-Service-Account).
- Optional (aktivierbar auch später): Zoho-Mail-Postfach, OpenAI-Key, Slack-Workspace.

## 1. DNS (bei IONOS)
Zwei A-Records auf die VPS-IP:

| Name | Typ | Wert |
|------|-----|------|
| `@` (sv-fwsffm.de) | A | `<VPS-IP>` |
| `archiv` | A | `<VPS-IP>` |

(AAAA analog, falls IPv6.) Mail-Records (MX/SPF/DKIM) siehe Schritt 6.

## 2. VPS bootstrappen
```bash
ssh root@<VPS-IP>
git clone <REPO-URL> /srv/sv/SV-Platform
cd /srv/sv/SV-Platform
bash infra/scripts/provision.sh      # Docker, Swap, Firewall, /srv/ffm
```

## 3. `.env` anlegen
```bash
cp .env.example .env
nano .env
```
Setzen:
- `APP_DOMAIN=sv-fwsffm.de`, `APP_URL=https://archiv.sv-fwsffm.de`
- `NODE_ENV=production`
- `POSTGRES_PASSWORD=<stark>`
- `AUTH_SECRET=<openssl rand -base64 33>`
- `AUTH_URL=https://archiv.sv-fwsffm.de`
- `ADMIN_EMAILS=<deine-google-mail>`
- `UPLOADS_DIR=/var/sv/uploads`

## 4. Google-OAuth (Login)
1. console.cloud.google.com → Projekt anlegen → **OAuth-Zustimmungsbildschirm** (intern/extern).
2. **Anmeldedaten → OAuth-Client-ID → Webanwendung.**
3. Autorisierte Redirect-URI: `https://archiv.sv-fwsffm.de/api/auth/callback/google`
4. `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in `.env` eintragen.

## 5. Erststart
```bash
./infra/scripts/deploy.sh            # build + migrate + up (mit Caddy/HTTPS)
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm web pnpm db:seed
```
Caddy holt automatisch Let's-Encrypt-Zertifikate. Danach:
- `https://archiv.sv-fwsffm.de/archiv` zeigt die migrierten Protokolle.
- Erster Login unter `/login` mit einer `ADMIN_EMAILS`-Adresse → wird automatisch **Admin**.

## 6. Mail aktivieren (Zoho, optional – jederzeit nachrüstbar)
1. Zoho-Mail-Konto mit eigener Domain anlegen (kostenlos bis 5 Postfächer).
2. Bei IONOS die von Zoho geforderten **MX-, SPF- und DKIM-Records** setzen.
3. In `.env`: `MAILBRAIN_ENABLED=true`, `IMAP_*`, `SMTP_*`, `OPENAI_API_KEY`.
4. `./infra/scripts/deploy.sh` erneut → der `mail-brain`-Container beginnt zu pollen.

## 7. Slack aktivieren (optional)
1. api.slack.com/apps → **Create App** → Bot-Token-Scopes: `chat:write`.
2. **Interactivity** einschalten, Request-URL: `https://archiv.sv-fwsffm.de/api/slack/interactions`.
3. In `.env`: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_INBOX_CHANNEL=#eingang`.
4. Deploy erneut. Der „Erledigt"-Button in Slack markiert Mails als bearbeitet.

## 8. Google Drive (Dokument-Freigaben)
1. In der Cloud Console einen **Service-Account** anlegen, JSON-Key laden.
2. Key als `secrets/drive-service-account.json` ablegen (oder JSON inline in
   `GOOGLE_SERVICE_ACCOUNT_JSON`).
3. Die freizugebenden Drive-Ordner **mit der Service-Account-E-Mail teilen** (Bearbeiter).
4. Im Admin unter **Drive-Zugang** die echten Ordner-IDs eintragen.

## 9. SV-FFM-Homepage (Wurzel-Domain)
Die bestehende Vite-Seite bleibt getrennt. Zwei Handgriffe:
1. In `SV-FFM/vite.config.js` `base` von `'/SV-FFM/'` auf **`'/'`** ändern und den
   Archiv-Link auf `https://archiv.sv-fwsffm.de` setzen.
2. `infra/github-workflows/deploy-ffm.yml` in die SV-FFM-Repo als
   `.github/workflows/deploy.yml` kopieren und die Secrets `VPS_HOST`, `VPS_USER`,
   `VPS_SSH_KEY` setzen → bei jedem Push landet `dist/` in `/srv/ffm`, Caddy liefert es
   an der Wurzel aus.

_(Alternative: GitHub Pages mit Custom-Domain – dann DNS `@`/`www` als CNAME auf
`<user>.github.io` statt auf den VPS.)_

## 10. Automatisches Deploy + Backups
- `infra/github-workflows/deploy-platform.yml` → in dieses Repo als
  `.github/workflows/deploy.yml` (Push auf `main` deployt via SSH).
- Backups per Cron: `0 3 * * * /srv/sv/SV-Platform/infra/scripts/backup.sh`.

## Update später
```bash
cd /srv/sv/SV-Platform && ./infra/scripts/deploy.sh
```

## Checkliste „läuft alles?"
- [ ] `https://archiv.sv-fwsffm.de/archiv` zeigt Protokolle
- [ ] Login als Admin funktioniert, `/admin` erreichbar
- [ ] PDF-Upload erscheint im Archiv; „intern" verschwindet aus der Öffentlichkeit
- [ ] `https://archiv.sv-fwsffm.de/api/calendar.ics` abonnierbar
- [ ] (falls aktiviert) Test-Mail wird klassifiziert, in Slack gemeldet, „Erledigt" wirkt
