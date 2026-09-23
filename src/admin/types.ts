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
  /** Status des Projekts: nur 'ongoing' wird in der Positionsliste gezeigt. */
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

export interface Project {
  project_id: string;
  name: string;
}

/** Zeile aus v_monatsbilanz: Ist-Zahlen je Monat plus fortgeschriebener Bestand. */
export interface MonthBalance {
  monat: string;
  einnahmen: number;
  ausgaben: number;
  spendentransfer: number;
  transfergebuehren: number;
  umbuchungen: number;
  netto: number;
  buchungen: number;
  bestand: number;
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
