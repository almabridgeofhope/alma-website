# Testing — alma-website

Umsetzung des verbindlichen Standards (Agent-Spec: Testing) für dieses Repo.

## Einstufung

**Stufe P (Produktiv).**

Merkmale, die zu P führen:

| Merkmal | Befund |
| --- | --- |
| Öffentliche Oberfläche | ja — `almabridgeofhope.org` (`CNAME`), Seiten unter `src/pages/` |
| Automatischer Deploy | ja — `.github/workflows/deploy.yml`, bei jedem Push auf `main` nach GitHub Pages |
| Geldfluss / Drittanbieter | ja — Spenden (Stripe, PayPal, SEPA), Mitgliedschaft, Kontaktformular |
| Interner Bereich | ja — `/admin` gegen Supabase (nicht Teil der ersten Testwellen) |
| Bisheriger Teststand | **keine Tests**, kein Testframework, CI prüft nichts vor dem Deploy |

Konsequenz: Jeder Push auf `main` geht ungeprüft live. Das ist die Lücke, die die
PR-Folge unten schliesst.

## Testbefehle

Vor und nach jeder Änderung laufen lassen, Ergebnis vergleichen:

```bash
npm ci
npm run lint     # eslint .
npm run build    # vite build + scripts/static-routes.js
```

Ab PR 6 zusätzlich:

```bash
npx playwright test                 # lokal gegen den Dev-/Preview-Server
npx playwright test --grep @smoke   # nur die Rauchproben
```

Solange es keine Unit-Tests gibt, ist `npm run build` der Mindest-Testbefehl:
er deckt TypeScript- und Importfehler auf.

## Regeln für Tests gegen Produktion

Verbindlich für alle Specs, die gegen `https://almabridgeofhope.org` laufen:

- **Nur lesend.** Seiten aufrufen, Navigation klicken, Inhalte prüfen.
- **Keine Formulare absenden** — weder Kontakt, Mitgliedschaft noch Spende.
  Geprüft wird, dass das Formular erscheint und validiert, nicht der Versand.
- **Keine Zahlung auslösen**, auch keine Sandbox-Zahlung aus dem Prod-Frontend.
- **Keine Testdatensätze** in Supabase, Google Drive oder den Apps-Script-Backends.
- Der interne Bereich `/admin` wird in Prod-Läufen nicht angefasst.

## PR-Folge

Jeder Schritt ist ein eigenes Arbeitspaket, ein PR, einzeln prüf- und zurückrollbar.
Die Nummern sind die Stufen der Agent-Spec: Testing.

### PR 1 — Linter + Build in CI

Workflow `ci.yml`: bei `pull_request` und Push auf `main` `npm ci`, `npm run lint`,
`npm run build`. Node 18 wie im Deploy-Workflow. Build ohne echte Secrets — es wird
geprüft, dass er durchläuft, nicht das Deploy-Artefakt. Ziel: kein roter Build
erreicht mehr `main`.

### PR 6 — Playwright-Specs für die öffentlichen Pfade

Playwright einrichten (`@playwright/test`, `playwright.config.ts`, `tests/e2e/`),
Specs gegen den lokalen Preview-Server, in CI mitlaufend:

- **Startseite** (`/`): lädt, Titel und Haupt-Call-to-Action sichtbar, keine
  Konsolenfehler.
- **Navigation**: `/about`, `/projects`, `/news`, `/contact`, `/impressum`,
  `/privacy` sind erreichbar und liefern nicht die NotFound-Seite; eine unbekannte
  Route liefert sie sehr wohl.
- **Spendenpfad** (`/donation`, `/spenden-statt-geschenke`): Formular rendert,
  Betragsauswahl und Zahlart sind bedienbar, Validierung meldet sich bei leerer
  Eingabe — **ohne Absenden**.
- **Kontaktpfad** (`/contact`): Formular rendert, Pflichtfelder validieren —
  **ohne Absenden**.

### PR 7 — Dieselben Specs als `@smoke` nach dem Deploy

Die Specs aus PR 6 mit `@smoke` markieren (Startseite, Navigation, Spenden- und
Kontaktpfad im Lesemodus). Der Deploy-Workflow bekommt nach dem `deploy`-Job einen
Job `smoke`, der `npx playwright test --grep @smoke` gegen `BASE_URL=https://almabridgeofhope.org`
laufen lässt. Rot heisst: Deploy ist durch, aber die Seite ist kaputt — sichtbar im
Actions-Log statt erst bei der nächsten Spende.

### PR 8 — Stündliche Rauchprobe gegen Produktion

Workflow `smoke-prod.yml` mit `schedule: cron "0 * * * *"` und `workflow_dispatch`,
derselbe `@smoke`-Lauf gegen die Live-Domain, nur lesend. Fehlschlag meldet sich über
die Actions-Benachrichtigung.

## Stand

- [x] Einstufung und Plan (dieses Dokument)
- [ ] PR 1 — Linter + Build in CI
- [ ] PR 6 — Playwright-Specs
- [ ] PR 7 — `@smoke` nach Deploy
- [ ] PR 8 — stündlich gegen Prod

Die Umsetzung beginnt nach Freigabe dieses Plans, PR für PR in dieser Reihenfolge.
