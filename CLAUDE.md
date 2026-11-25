# CLAUDE.md – alma-website

Öffentliche Website almabridgeofhope.org (Vite, React, shadcn) mit internem Verwaltungsbereich unter
`/admin`. Wie getestet wird und was Fremdsysteme berührt: `TESTING.md`.

## Was hier besonders ist

- **Jeder Push auf `main` geht live** (GitHub Pages, `.github/workflows/deploy.yml`), aber erst nach
  grünen Checks: `deploy.yml` ruft `ci.yml` als Job `checks` auf, `build` hat `needs: checks`. Ein
  eigener CI-Lauf bei Push auf `main` entfällt, `ci.yml` läuft bei Pull Requests und über den Deploy.
  Der Deploy lässt sich auch von Hand starten (`workflow_dispatch`: `gh workflow run deploy.yml --ref main`),
  etwa wenn ein Push-Ereignis ausfiel; `build` läuft nur auf `main`, auf anderen Zweigen bleibt es bei den
  Checks. Es gibt keine Staging-Seite und keinen Smoke-Test nach dem Deploy.
- **Keine eigene Datenbank.** Schema, Views, RPCs, RLS und die Edge Functions (`form-submit`,
  `stripe-checkout`, `paypal-subscription`, `receipt-read`) liegen in alma-data-platform. Braucht
  eine Änderung hier eine neue Spalte oder View, kommt sie dort als Migration.
- **`/admin` schreibt direkt in die Produktions-DB** (supabase-js, `src/admin/*Queries.ts`). Lokal
  gegen Prod klicken heißt in Produktion schreiben.
- **Zahlungen laufen noch über die Apps Scripts** (`apps-script-*-backend.js`). Die Dateien werden von
  Hand nach script.google.com kopiert, nicht deployt. Seit 28.10.2026 meldet die Seite jede Sitzung
  bzw. jeden Plan zusätzlich an die Nachfolger in alma-data-platform (Parallelbetrieb).
- Die Deploy-Schritte, die Secrets an die Apps Scripts schicken, laufen mit `continue-on-error` und
  scheitern still.
- `mailings/` enthält HTML-Vorlagen für Rundmails. Kein Code verschickt sie.

## Regeln für Code

- **Neue öffentliche Route → Eintrag in `PAGE_ROUTES`** (`scripts/static-routes.js`). Sonst liefert
  GitHub Pages sie über `404.html` mit Status 404 aus, und sie fehlt in `sitemap.xml`.
- **Deep-Link-Umleitung:** `404-redirect-path` liest nur `takePendingRedirect` in `src/App.tsx`. Kein
  zweiter Leser.
- **`import.meta.env.VITE_*` nur statisch lesen**, nie über einen berechneten Schlüssel.
- **In die Build-Env von `deploy.yml` nur öffentliche Werte.** Jedes `VITE_*` im Build steht im
  Bundle; Secret Keys und Setup-Tokens gehören nur in die Sync-Schritte zu den Apps Scripts.
- `VITE_STAGE` ist im Deploy fest `prod` und wird nicht als Secret angelegt; ohne den Wert läuft
  PayPal gegen die Sandbox.
- **Kontaktformular:** `to_email` nie in den Payload, der Empfänger gehört ins EmailJS-Template. `VITE_EMAILJS_*` und
  `VITE_RECAPTCHA_SITE_KEY` (Vorlage `.env.example`) müssen gesetzt sein, sonst bricht `vite build` ab (der Dev-Server startet auch ohne); der CI-Build setzt
  Platzhalter. Das Honigtopf-Feld `kontakt-zusatzfeld` (kein Name wie `website`, den Autofill füllt) bleibt unsichtbar, nicht fokussierbar und `aria-hidden`.
- **reCAPTCHA v2 im Kontaktformular:** das Skript von Google lädt, sobald das Formular auf der Kontaktseite erscheint, ohne Einwilligungsklick (`src/components/RecaptchaFeld.tsx`, `src/lib/recaptcha.ts`), nie auf anderen Seiten und nie über `index.html`. Rechtsgrundlage in der Datenschutzerklärung: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) und § 25 Abs. 2 Nr. 2 TDDDG, bewusste Entscheidung des Vorstands. Der Token geht als `g-recaptcha-response` an EmailJS; ohne Token oder ohne Site-Key wird nicht gesendet. Der Secret Key steht nur im EmailJS-Template, nie im Repo, in `deploy.yml` oder im Bundle.
- **Jeder neue Text in `translations.en` und `translations.de`** (`src/contexts/translations.ts`).
- **Neuer Drittanbieter oder Datenfluss (Skript, Einbettung, Formular, Dienst) → Abschnitt in `src/pages/Privacy.tsx` samt `privacy.*` in `src/contexts/translations.ts` (en und de)** im selben PR, dazu der Name in der Liste in `src/contexts/datenschutz.test.ts`. Heute nennt die Erklärung u. a. GitHub, Google (Fonts, Maps, Analytics, Apps Script, Drive), EmailJS, PayPal, Stripe, Supabase, IONOS, Telegram, Wise.
- **Verträge mit alma-data-platform nicht einseitig ändern:** Payload an `form-submit` (Typen dort in
  `supabase/functions/form-submit/index.ts`, z. B. Geschenknachricht höchstens 300 Zeichen),
  Verwendungszweck `ALMA-{intentId}` bei Überweisung, Antwortformen der Zahlungs-Backends, Felder der
  RPC `website_projektpositionen` und der Admin-Views.
- Die Vergleichsmeldung an alma-data-platform (`stripeService.ts`, `paypalService.ts`) hält Spende
  und Checkout nie auf: ohne `await`, Fehler werden verschluckt, `text/plain` gegen den CORS-Preflight. Bewusste Ausnahme.
- Laufende Kosten (Projekt „Other“, Menge 500) zählen nie als offener Bedarf
  (`src/pages/admin/AdminTransfers.tsx`).
- Node-Version nur in `.nvmrc`. Der ESLint-Deckel `--max-warnings` in `ci.yml` darf nur sinken.

## Versandwege

| Datei | Absender | Empfängerkreis | Auslöser |
|---|---|---|---|
| `src/components/KontaktFormular.tsx` (Kontaktformular über EmailJS, eingebunden in `src/pages/Contact.tsx`; Service, Template und Public Key aus `VITE_EMAILJS_*`, dazu der reCAPTCHA-Token) | das bei EmailJS hinterlegte Konto; Reply-To = Besucher | `info@almabridgeofhope.org`, fest im EmailJS-Template (To Email), der Browser schickt keinen Empfänger mit | Besucher schickt das Kontaktformular ab, nach gelöstem reCAPTCHA; ein befülltes Honigtopf-Feld oder ein fehlender Token sendet nichts |

Keine E-Mail sonst. Newsletter-Anmeldung (`src/components/NewsletterForm.tsx`, Spendenformular),
Mitgliedsantrag und Spendenabsicht gehen als Daten an `form-submit` in alma-data-platform; Mails
daraus (Spendenbestätigung) verschickt alma-data-platform. Rundmails aus `mailings/` gehen von Hand
raus.

## Prod-Zugriffe

| Werkzeug | Schreibt in | Trockenlauf |
|---|---|---|
| `/admin` (`src/admin/*Queries.ts`) | Prod-DB: `transactions`, `payment_log`, `plan_*`, `plan_ausgaben`, `allowance_positionen` | fehlt, es gibt keine Dev-DB |
| `/admin` (`src/lib/googleDrive.ts`) | Dateinamen in Google Drive | fehlt |
| Formulare der Seite (Spende, Mitgliedschaft, Newsletter, Kontakt) | `form-submit`, Stripe, PayPal, EmailJS | fehlt, auch lokal echt |
| `deploy.yml` (jeder Push auf `main`) | GitHub Pages, Secrets in die Apps Scripts (`action: setup`) | – |
| `scripts/sync-secrets.sh` | GitHub-Secrets aus `.env.local` | fehlt |

## Tests

- Testdatensätze nur mit Freigabe, mit Präfix `TEST-` bzw. den Testadressen aus alma-data-platform.
- Ein Prod-Test schickt keinen der Schreibwege oben ab. Keine Tests für die Apps-Script-Dateien.

<!-- BEGIN gemeinsame Regeln – aus Notion „Agent-Spec: Tech“, nicht von Hand ändern -->
## Gemeinsame Regeln

Gilt für jedes Repo. Ein nächtlicher Abgleich schreibt diesen Abschnitt wörtlich in die `CLAUDE.md` jedes Repos und öffnet einen PR, wenn er sich geändert hat. Änderungen deshalb nur hier, nie in den Repos.

### Code

- **Werte auf einen Blick lesbar.** Braucht eine Zuweisung einen verschachtelten Ausdruck, kommt er in eine Hilfsfunktion: `TIMEOUT = _float_env("TIMEOUT", 30.0)` statt `TIMEOUT = float(os.environ.get("TIMEOUT") or "30.0")`. Gilt auch für Modulkonstanten, Klassenattribute und Standardwerte in Signaturen.
- **`requests.Response` ist bei Status ≥ 400 falsy.** `if not response` verschluckt jeden Fehlerstatus. Für „keine Antwort“ `if response is None` schreiben.
- **Ein Fehler endet als Fehler.** Kein `except`, das einen Fehler verschluckt und danach weiterschreibt; ein gescheiterter Abruf ist keine leere Liste und kein „nichts zu tun“; ein Skript, das scheitert, endet mit Exit-Code ≠ 0.
- **Erst Vorhandenes nutzen:** Codebase, Standardbibliothek, installierte Abhängigkeit, dann ein Einzeiler, erst dann neuer Code. Nie kürzen: Eingabeprüfung, Fehlerbehandlung gegen Datenverlust, Security, Barrierefreiheit.
- **Kein Umbau außerhalb der Aufgabe.**

### Daten und Dienste

- **Versand nur über die Versandwege der `CLAUDE.md`.** Code versendet E-Mails nur über die Wege, die im Abschnitt „Versandwege“ der `CLAUDE.md` des Repos stehen (Datei, Absender, Empfängerkreis). Ein neuer Versandweg oder ein neuer Empfängerkreis braucht eine Freigabe. Was im eigenen Namen an Dritte schreibt, legt einen Entwurf an, außer der Eintrag unter „Versandwege“ erlaubt ausdrücklich den direkten Versand (mit seinem Schalter).
- **Testmails nur an freigegebene eigene Adressen:** `clara@thuemecke.net`, `clara@almabridgeofhope.org`, `clara.thue@gmail.com`, `c.thuemecke.extern@intega-solutions.com`. Den Empfänger aus der Konfiguration lesen, nicht fest eintragen. Nie an Dritte, auch nicht „nur kurz“.
- **Produktionsdaten nur mit Freigabe schreiben.** Lesen ist erlaubt.
- **Prod nur über die Prod-Zugriffe der `CLAUDE.md`.** Personio standardmäßig mit `PERSONIO_CLIENT_ID_DEV` / `PERSONIO_CLIENT_SECRET_DEV`, die Variablen ohne `_DEV` zeigen auf Produktion. Zugriff auf eine Produktivumgebung nur in Werkzeugen aus dem Abschnitt „Prod-Zugriffe“ der `CLAUDE.md`, dort mit Trockenlauf als Standard. Geschrieben wird erst mit ausdrücklichem Schalter nach Freigabe.
- **Secrets nur aus `.env` oder dem Secret-Store**, nie im Code, in Logs, Tests oder Commits.
- **Neue Aufrufe kostenpflichtiger APIs** (Sprachmodelle, bezahlte Dienste) nur mit Freigabe.

### Tests und Doku

- Testbefehl und Stand stehen in `TESTING.md`. Vor und nach der Änderung laufen lassen.
- Ein Bugfix bekommt einen Regressionstest, erst rot, dann grün. Tests gehören in denselben PR wie der Code.
- HTTP-Antworten in Tests als echte `requests.Response`-Objekte bauen, Prozessaufrufe als echtes `CompletedProcess`. Ein `MagicMock` ist immer truthy und läuft am Fehler vorbei.
- **Doku im selben PR:** Ändert ein PR ein Verhalten, das in `CLAUDE.md`, `README.md` oder `TESTING.md` beschrieben ist, ändert er die Datei mit.
- **Jede Regel steht nur in der `CLAUDE.md`.** `README.md` erklärt Zweck, Einrichtung und Bedienung, `TESTING.md` den Teststand, `docs/` das Nachschlagewissen (Architektur, Abläufe, Entscheidungsgeschichte). Dort stehen keine Regeln, höchstens ein Verweis. Keine `AGENTS.md`, keine Cursor- oder Copilot-Regeln.
- Keine ADR-Dateien. Entscheidungen stehen in `CLAUDE.md` oder `docs/architecture.md`.

### Pull Requests

- **Titel** im Conventional-Commit-Format, Imperativ, höchstens 70 Zeichen, ohne Personennamen.
- **Beschreibung höchstens 200 Wörter:** 1–3 Sätze, warum die Änderung nötig ist und was sie bewirkt, dann die Zeilen `Getestet:` (Befehl oder Vorgehen und Ergebnis) und `Achtung:` (Risiko, offene Entscheidung oder „keins“). Kein Nacherzählen des Diffs, keine Dateiliste, kein Arbeitsprotokoll.
- **Keine personenbezogenen Daten** in Titel, Beschreibung, Kommentaren und Commit-Messages: keine Namen oder Kürzel von Betroffenen mit Zahlen, keine Gehälter, Provisionen, Adressen oder Datensätze. Keine Secrets.
- **Ergebnisse und Analysen gehören ins Ticket oder nach Notion**, die PR verlinkt nur darauf.
- Ist doch etwas hineingeraten: Beschreibung ersetzen, die alte Fassung aus der Bearbeitungshistorie löschen, Secrets zusätzlich rotieren.

### Git

- Conventional Commits (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`), kein `Co-Authored-By`.
- In Commit-Messages und Code-Kommentaren niemanden nennen, weder Mensch noch Assistent. Die Entscheidung nennen, nicht wer sie getroffen hat.
- Ein PR je Arbeitspaket, Squash-Merge. Nie auf `main` arbeiten, nie `--no-verify`, nie ohne Freigabe mergen.
- Ausführlich: Notion „Agent-Spec: Tech“, Abschnitt Git-Regeln.
<!-- END gemeinsame Regeln -->
