/** Überweisung nach Uganda: transactions mit kategorie = 'spendentransfer'. */
export interface Transfer {
  transaction_id: string;
  /** Laufende Nummer aus der Buchhaltung, fuehrende Kennung der Buchung. */
  buchung_nr: number | null;
  zweck: string | null;
  external_transaction_id: string | null;
  date: string;
  konto: string;
  amount: number;
  currency: string;
  original_amount: number | null;
  original_currency: string | null;
  exchange_rate: number | null;
  reference: string | null;
  receipt_url: string | null;
  /** Transaktionskosten, die als eigene Zeilen gebucht sind und hier angehaengt werden. */
  fee_eur: number;
}

/** Zeile aus v_project_items. */
export interface ProjectItem {
  project_item_id: string;
  project_id: string;
  projekt: string | null;
  /** Status des Projekts: nur 'ongoing' wird in der Positionsliste gezeigt, 'laufend' (laufende Kosten) zaehlt nie als offener Bedarf. */
  projekt_status: string | null;
  phase: string | null;
  item_name: string | null;
  status: string | null;
  qty_needed: number | null;
  qty_paid: number | null;
  qty_open: number;
  total_ugx: number | null;
  paid_ugx: number | null;
  open_ugx: number;
  open_eur: number | null;
}

/** Zuordnung einer Position zu einer Überweisung. */
export interface Assignment {
  payment_log_id: string;
  item_id: string | null;
  qty_paid: number | null;
  amount_paid_ugx: number | null;
  external_transaction_id: string;
  /** Pfad des Belegs im Bucket. Kurze Altwerte sind Belegnummern ohne Datei. */
  expenditure_id: string | null;
  created_at: string;
}

export interface TransferSummary extends Transfer {
  assignmentCount: number;
  assignedUgx: number;
  receiptCount: number;
}

export interface Phase {
  phase_id: string;
  phase_de: string | null;
  phase_en: string | null;
}

/** Phase mit ihrem Projekt, aus project_phases. */
export interface ProjectPhase extends Phase {
  project_id: string;
  rang: number;
}

export interface Project {
  project_id: string;
  name: string;
}


/** Zeile aus v_kontoabgleich: abgelesener Kontostand gegen die Buchungen. */
export interface AccountCheck {
  konto: string;
  stichtag: string | null;
  saldo_gemessen: number | null;
  summe_gebucht: number;
  startsaldo_implizit: number | null;
  buchungen: number | null;
  notiz: string | null;
  /** saldo_gemessen ohne den schwebenden Teil: was tatsaechlich auf dem Konto liegt. */
  saldo_verfuegbar: number | null;
  /** Noch nicht verfuegbar (Stripe pending, PayPal withheld), in saldo_gemessen enthalten. */
  schwebend: number | null;
  /** Stand laut Anbieter. PayPal hinkt hier einige Stunden hinterher. */
  abgelesen_um: string | null;
  /** Die Differenz ist geklaert (Notiz sagt warum) und gilt nicht als offen. */
  differenz_erklaert: boolean;
}

/** Zeile aus v_beitragskonto: Soll gegen Ist je Mitglied. */
export interface DuesAccount {
  contact_id: string;
  name: string | null;
  beitrag_eur: number;
  mitglied_seit: string;
  monate: number;
  soll: number;
  ist: number;
  saldo: number;
  davon_beitrag: number;
  davon_spende: number;
  rueckstand: number;
  rueckstand_monate: number;
  letzte_zahlung: string | null;
  zahlungen: number;
}

/** Zeile aus v_finanzvorschau: ab wann eine Phase finanziert ist. */
export interface ForecastRow {
  rang: number;
  projekt: string;
  phase: string;
  offen_eur: number;
  offen_high: number | null;
  kosten_kumuliert: number;
  monate_erwartet: number | null;
  monate_konservativ: number | null;
  finanziert_ab_erwartet: string | null;
  finanziert_ab_konservativ: string | null;
}

/** Zeile aus plan_einnahmen: eine erwartete Einnahme ausserhalb der Beitraege. */
export interface PlannedIncome {
  plan_id: string;
  bezeichnung: string;
  kategorie: string;
  betrag_eur: number;
  rhythmus: string;
  von_datum: string;
  bis_datum: string | null;
  sicherheit: string;
  contact_id: string | null;
  project_id: string | null;
  kommentar: string | null;
}


/** Zeile aus plan_ausgaben: eine laufende oder geplante Ausgabe. */
export interface PlannedCost {
  plan_id: string;
  bezeichnung: string;
  kategorie: string;
  betrag_eur: number;
  rhythmus: string;
  von_datum: string;
  bis_datum: string | null;
  project_id: string | null;
  kommentar: string | null;
}

/**
 * Zeile aus v_finanzverlauf: ein Monat, eine Richtung, eine Art.
 *
 * Langformat, weil die Arten je Monat wechseln — in der Vergangenheit steht auf der
 * Ausgabenseite nur `laufende_kosten`, in der Zukunft die geplanten Kategorien.
 */
export interface CashflowRow {
  monat: string;
  richtung: "ein" | "aus";
  art: string;
  /** true = tatsaechlich geflossen, false = aus der Planung gerechnet. */
  gemessen: boolean;
  /** Immer positiv; die Richtung steht in der eigenen Spalte. */
  betrag: number;
}

/** Zeile aus v_kontodeckung: Bestand auf allen Konten zum Monatsende. */
export interface CoverageRow {
  monat: string;
  bestand: number;
  /** true = an den abgelesenen Kontostaenden verankert, false = fortgeschrieben. */
  gemessen: boolean;
}

/** Zeile aus v_plan_transfers: ein geplanter Transfer mit Summen. */
export interface PlannedTransfer {
  plan_transfer_id: string;
  /** Monatserster des geplanten Monats. */
  geplant_fuer: string;
  /** Der Monat, in dem die Vorschau ihn zaehlt — bei einem ueberfaelligen Plan der laufende. */
  faellig_monat: string;
  ueberfaellig: boolean;
  bezeichnung: string;
  status: "geplant" | "ausgefuehrt" | "verworfen";
  kommentar: string | null;
  positionen: number;
  ugx_geplant: number;
  eur_geplant: number;
  /** Was davon noch zaehlt: gekappt auf das Offene, 0 sobald ausgefuehrt. */
  eur_wirksam: number;
  transaction_id: string | null;
  external_transaction_id: string | null;
  ist_datum: string | null;
  ist_eur: number | null;
  ausgefuehrt_am: string | null;
  created_at: string;
}

/** Zeile aus v_plan_transfer_positionen. */
export interface PlannedTransferItem {
  plan_transfer_id: string;
  item_id: string;
  projekt: string | null;
  phase: string | null;
  item_name: string | null;
  status: PlannedTransfer["status"];
  faellig_monat: string;
  qty_geplant: number;
  /** Geplante Menge, gekappt auf das, was offen und nicht frueher verplant ist. */
  qty_wirksam: number;
  /** Nur gesetzt, wenn vom Stueckpreis abgewichen wird. */
  betrag_ugx: number | null;
  ugx_geplant: number;
  ugx_wirksam: number;
  eur_geplant: number;
  eur_wirksam: number;
}
