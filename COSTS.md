# Kostenplanung

Alle Beträge grob, pro Jahr, Stand der Planung. Selbst gehostet, DSGVO-konform.

## Empfohlene Variante (Slack)

| Posten | Anbieter | Kosten/Jahr |
|--------|----------|-------------|
| VPS (Hosting + DB + Mail-Brain) | IONOS VPS M | **60 €** |
| Domain `.de` | IONOS | **~1 €** |
| Mail-Postfächer (eigene Domain, ≤ 5) | Zoho Mail Free | **0 €** |
| KI-Klassifikation (~500 Mails/Jahr, kurze Texte) | OpenAI GPT-4o-mini | **~0,50 €** |
| Team-Chat + Bot | Slack (Free) | **0 €** |
| Dokument-Freigaben | Google Drive API (Service-Account) | **0 €** |
| HTTPS-Zertifikate | Caddy + Let's Encrypt | **0 €** |
| **Gesamt** | | **≈ 62 €/Jahr** |

→ Weniger als **6 €/Monat** für Website, Archiv, Datenbank, PDF-Uploads,
Admin-Login, geteilten Kalender **und** smartes Mail-Routing mit KI.

## Alternative (WhatsApp statt Slack)

WhatsApp braucht eine verifizierte Business-Nummer und i. d. R. eine
Middleware-Plattform – deutlich teurer und aufwändiger.

| Zusatzposten | Kosten/Jahr |
|--------------|-------------|
| Dedizierte SIM/Nummer für den Bot | 60–120 € |
| Middleware (z. B. Astra o. ä.) | 0–360 € |
| Meta-Business-Verifizierung | Aufwand, kein fixer Preis |
| **Gesamt (statt Slack)** | **≈ 120–600 €/Jahr** |

**Empfehlung: Slack.** Mitglieder melden sich mit ihrer E-Mail an (kein
Telefonnummer-Chaos), der Bot ist in ~30 Minuten eingerichtet, Kosten 0 €.

## Warum OpenAI GPT-4o-mini
Bei ~500 kurzen Mails/Jahr liegen die Klassifikations-Kosten im **Cent-Bereich**.
`gpt-4o-mini` liefert stabile JSON-Ausgaben (Kategorie, 3-Satz-Zusammenfassung,
Dringlichkeit, optionaler Termin). Fällt der Key weg, klassifiziert das System per
Schlagwort-Heuristik weiter – es bleibt also funktionsfähig.

## Skaliert das?
Ein VPS M trägt die SV-Last mühelos. Mehr Postfächer bei Zoho oder mehr Slack-
Historie ließen sich später gegen kleine Beträge nachbuchen – nötig ist das für
den SV-Betrieb aber nicht.
