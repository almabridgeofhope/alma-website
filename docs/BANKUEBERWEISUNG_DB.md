# Anleitung für Datenbank / Backend: Manuelle Banküberweisung (Wise / SEPA)

Diese Notiz beschreibt, was die Spendenseite (`/donation`) bei der Zahlungsart **Überweisung** sendet und wie ihr Zahlungseingänge den Stammdaten zuordnen und Belege auslösen könnt.

## Kurzfassung

1. Der Nutzer wählt **Einmalspende** und **Überweisung**, füllt das Formular aus und klickt auf **Spende registrieren & Bankdaten anzeigen**.
2. Das Frontend erzeugt eine **`intentId`** (UUID), sendet sie an **`VITE_FORM_SUBMIT_URL`** und zeigt als **Verwendungszweck** den String **`ALMA-{intentId}`** (Beispiel: `ALMA-550e8400-e29b-41d4-a716-446655440000`).
3. Parallel wird (falls konfiguriert) der **Legacy-Webhook** (`VITE_DONATION_WEBHOOK_URL`) mit `paymentMethod: "bank-transfer"` und `paymentStatus: "pending"` aufgerufen. **Hinweis:** Wenn nur `VITE_SUPABASE_WEBHOOK_URL` gesetzt ist, macht der Client-Webhookservice derzeit **keinen** echten POST ins Backend; die Quelle der Wahrheit für die Überweisungs-Spenden ist dann der **Form-Submit** (Punkt 2).

## Payload an `VITE_FORM_SUBMIT_URL` (JSON)

Bereits vorhandene Felder (Auszug) — bei Überweisung ist `paymentMethod` gleich **`bank-transfer`**:

| Feld | Bedeutung |
|------|-----------|
| `formType` | `"donation"` |
| `intentId` | UUID; eindeutige technische ID der Spendenvormerkung |
| `paymentMethod` | `"bank-transfer"` |
| `amount` / `totalAmount` | Betrag in EUR (Zahl) |
| `donationType` | `"one-time"` (Überweisung nur für Einmalspenden) |
| Spender-Stammdaten | `donorEmail`, `donorName`, `donorType`, Adresse, Geschenkspende, `wantsReceipt`, etc. |

**Neu:** Wenn der Warenkorb nicht leer ist, sendet das Frontend zusätzlich:

| Feld | Bedeutung |
|------|-----------|
| `donationLineItems` | Array mit `id`, `type`, `name`, `unitPrice`, `quantity`, `totalPrice`, optional `projectName`, `phase`, `itemId` |

Damit lassen sich Projekt-Items und allgemeine Spenden der Buchung zuordnen, ohne nur den Gesamtbetrag zu haben.

## Matching am Bankkonto (Wise / Kontoauszug)

- **Verwendungszweck** des Zahlers muss exakt **`ALMA-{intentId}`** enthalten (Großschreibung `ALMA`, Bindestrich, vollständige UUID).
- Primärer Match: **`intentId`** aus dem Verwendungszweck → Datensatz aus dem Form-Submit mit gleichem `intentId`.
- Plausibilitätschecks (empfohlen): Betrag (Toleranz Rundung), Währung EUR, Zeitfenster.

## Statusmodell (Vorschlag)

| Status | Wann |
|--------|------|
| `pending` | Nach Registrierung im Formular / erstem Webhook |
| `paid` | Nach gebuchtem Geldeingang und erfolgreichem Match |
| `failed` / `expired` | Optional: Timeout, storniert, Betrag passt nicht |

## Automatischer Zahlungsbeleg / Spendenquittung

- Wenn im Datensatz **`wantsReceipt: true`** (und Adresse vorhanden, je nach eurer Logik): nach Setzen auf **`paid`** den **Zahlungsbeleg bzw. Spendenbescheid** generieren und per E-Mail versenden (wie bei Stripe/PayPal).
- Für **Geschenkspenden** (`isGift`) die gleichen Regeln wie bei anderen Zahlungsarten anwenden.

## Konfiguration der Bankdaten auf der Website

- **Manuelle Überweisung (Wise):** Im Frontend sind als Fallback hinterlegt: Kontoinhaber **Alma Bridge of Hope e.V.**, IBAN **BE37903000230728**, BIC **TRWIBEB1XXX**, Bank **Wise**. Überschreiben per **`VITE_BANK_TRANSFER_IBAN`**, **`VITE_BANK_TRANSFER_BIC`**, **`VITE_BANK_TRANSFER_ACCOUNT_HOLDER`**, **`VITE_BANK_TRANSFER_BANK_NAME`** (z. B. in GitHub Secrets / `.env`).
- **Stripe SEPA / andere:** Unverändert die bisherigen **`VITE_SEPA_*`** Variablen (getrennt von der Wise-Anzeige für Überweisung).

## Offene Punkte für euch

1. **Form-Submit-Endpoint:** Sicherstellen, dass `paymentMethod: "bank-transfer"` und `donationLineItems` persistiert werden und `intentId` unique indexiert ist.
2. **Supabase-only-Betrieb:** Falls keine Legacy-Webhooks genutzt werden, die pending Spende **serverseitig** aus dem Form-Submit speichern oder eine dedizierte Edge Function aufrufen, damit nichts „nur im Browser“ hängen bleibt.
3. **Wise-Import:** Regel definieren, ob der Import per CSV/API den Verwendungszweck zuverlässig liefert; ggf. Regex `ALMA-[0-9a-f-]{36}`.

Bei Rückfragen zur genauen JSON-Struktur: Request-Body in den Logs des Form-Submit-Endpoints prüfen (ein Test mit Überweisungsoption auf Staging).
