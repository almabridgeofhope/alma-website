/** Überweisung nach Uganda: transactions mit kategorie = 'spendentransfer'. */
export interface Transfer {
  transaction_id: string;
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
}

/** Zeile aus v_project_items. */
export interface ProjectItem {
  project_item_id: string;
  project_id: string;
  projekt: string | null;
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
}

export interface Project {
  project_id: string;
  name: string;
}
