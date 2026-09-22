import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Assignment, Phase, Project, ProjectItem, Transfer, TransferSummary } from "./types";

const TRANSFER_KATEGORIE = "spendentransfer";

const TRANSFER_COLUMNS =
  "transaction_id, buchung_nr, zweck, external_transaction_id, date, konto, amount, currency, original_amount, original_currency, exchange_rate, reference, receipt_url, fee_eur";
const ASSIGNMENT_COLUMNS =
  "payment_log_id, item_id, qty_paid, amount_paid_ugx, external_transaction_id, expenditure_id, created_at";
const ITEM_COLUMNS =
  "project_item_id, project_id, projekt, phase, item_name, status, qty_needed, qty_paid, qty_open, total_ugx, paid_ugx, open_ugx, open_eur";

export const queryKeys = {
  transfers: ["admin", "transfers"] as const,
  items: ["admin", "items"] as const,
  assignments: (transferId: string) => ["admin", "assignments", transferId] as const,
};

/** Stückpreis aus Gesamtpreis und Menge — unit_cost_ugx steckt nicht in der View. */
export const unitCostUgx = (item: Pick<ProjectItem, "total_ugx" | "qty_needed">): number => {
  const qty = item.qty_needed ?? 0;
  return qty > 0 ? (item.total_ugx ?? 0) / qty : 0;
};

/** Was eine Zuordnung gekostet hat: der erfasste Ist-Betrag, sonst Menge mal Stückpreis. */
export const assignmentUgx = (assignment: Assignment, item?: ProjectItem): number => {
  if (assignment.amount_paid_ugx !== null) return assignment.amount_paid_ugx;
  if (!item) return 0;
  return (assignment.qty_paid ?? 0) * unitCostUgx(item);
};

// Gelesen wird die View, weil Transfers nach Uganda in zwei Konventionen gebucht sind
// (kategorie = spendentransfer und die XE-Zahlungen unter ausgabe). Geschrieben wird
// weiterhin in transactions.
async function fetchTransfers(): Promise<Transfer[]> {
  const { data, error } = await supabase
    .from("v_uganda_transfers")
    .select(TRANSFER_COLUMNS)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Transfer[];
}

async function fetchAllAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase.from("payment_log").select(ASSIGNMENT_COLUMNS);
  if (error) throw new Error(error.message);
  return (data ?? []) as Assignment[];
}

async function fetchItems(): Promise<ProjectItem[]> {
  const { data, error } = await supabase
    .from("v_project_items")
    .select(ITEM_COLUMNS)
    .order("project_item_id");
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectItem[];
}

export const useProjectItems = () => useQuery({ queryKey: queryKeys.items, queryFn: fetchItems });

/** Überweisungen mit dem, was ihnen schon zugeordnet ist. */
export const useTransferSummaries = () => {
  const items = useProjectItems();

  return useQuery({
    queryKey: queryKeys.transfers,
    enabled: items.isSuccess,
    queryFn: async (): Promise<TransferSummary[]> => {
      const [transfers, assignments] = await Promise.all([fetchTransfers(), fetchAllAssignments()]);
      const itemById = new Map((items.data ?? []).map((item) => [item.project_item_id, item]));

      return transfers.map((transfer) => {
        const own = assignments.filter(
          (a) => a.item_id !== null && a.external_transaction_id === transfer.external_transaction_id,
        );
        return {
          ...transfer,
          assignmentCount: own.length,
          assignedUgx: own.reduce((sum, a) => sum + assignmentUgx(a, itemById.get(a.item_id ?? "")), 0),
          receiptCount: own.filter((a) => isReceiptFile(a.expenditure_id)).length,
        };
      });
    },
  });
};

export const useAssignments = (transferId: string) =>
  useQuery({
    queryKey: queryKeys.assignments(transferId),
    queryFn: async (): Promise<Assignment[]> => {
      const { data, error } = await supabase
        .from("payment_log")
        .select(ASSIGNMENT_COLUMNS)
        .eq("external_transaction_id", transferId)
        .not("item_id", "is", null)
        .order("created_at");
      if (error) throw new Error(error.message);
      return (data ?? []) as Assignment[];
    },
  });

/** Nach jeder Änderung: Zuordnungen, Positionen (Trigger pflegt qty_paid) und Liste neu laden. */
const useRefresh = (transferId?: string) => {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: queryKeys.items });
    client.invalidateQueries({ queryKey: queryKeys.transfers });
    if (transferId) client.invalidateQueries({ queryKey: queryKeys.assignments(transferId) });
  };
};

export interface NewTransfer {
  external_transaction_id: string;
  date: string;
  konto: string;
  amount: number;
  reference: string | null;
  original_amount: number | null;
  exchange_rate: number | null;
}

export const useCreateTransfer = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (input: NewTransfer) => {
      const { error } = await supabase.from("transactions").insert({
        external_transaction_id: input.external_transaction_id,
        date: input.date,
        konto: input.konto,
        // Abflüsse werden negativ geführt, wie alle bestehenden Transfers.
        amount: -Math.abs(input.amount),
        currency: "EUR",
        kategorie: TRANSFER_KATEGORIE,
        status: "completed",
        reference: input.reference,
        original_amount: input.original_amount === null ? null : -Math.abs(input.original_amount),
        original_currency: input.original_amount === null ? null : "ugx",
        exchange_rate: input.exchange_rate,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};

export interface NewAssignment {
  transferId: string;
  itemId: string;
  qtyPaid: number;
  amountPaidUgx: number | null;
  /** Link auf die Datei in Google Drive, sofern die Quittung schon vorliegt. */
  receiptUrl: string | null;
}

export const useCreateAssignment = (transferId: string) => {
  const refresh = useRefresh(transferId);
  return useMutation({
    mutationFn: async (input: NewAssignment) => {
      const { error } = await supabase.from("payment_log").insert({
        external_transaction_id: input.transferId,
        item_id: input.itemId,
        qty_paid: input.qtyPaid,
        amount_paid_ugx: input.amountPaidUgx,
        expenditure_id: input.receiptUrl,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};

export const useUpdateAssignment = (transferId: string) => {
  const refresh = useRefresh(transferId);
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Assignment> }) => {
      const { error } = await supabase.from("payment_log").update(patch).eq("payment_log_id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};

export const useDeleteAssignment = (transferId: string) => {
  const refresh = useRefresh(transferId);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_log").delete().eq("payment_log_id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};

/** Ein echter Beleg ist ein Link auf die Datei in Drive; kurze Altwerte sind blosse Nummern. */
export const isReceiptFile = (expenditureId: string | null): boolean =>
  expenditureId !== null && expenditureId.startsWith("http");

/** Quittung aus Uganda an einer bestehenden Zuordnung ersetzen oder nachreichen. */
export const useSetAssignmentReceipt = (transferId: string) => {
  const refresh = useRefresh(transferId);
  return useMutation({
    mutationFn: async ({ paymentLogId, receiptUrl }: { paymentLogId: string; receiptUrl: string }) => {
      const { error } = await supabase
        .from("payment_log")
        .update({ expenditure_id: receiptUrl })
        .eq("payment_log_id", paymentLogId);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};

/** Bank- oder Wise-Beleg an der Überweisung selbst. */
export const useSetTransferReceipt = (transferId: string) => {
  const refresh = useRefresh(transferId);
  return useMutation({
    mutationFn: async (receiptUrl: string) => {
      const { error } = await supabase
        .from("transactions")
        .update({ receipt_url: receiptUrl })
        .eq("external_transaction_id", transferId);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};

/** Belege liegen in Drive, gespeichert ist der Link darauf. */
export async function openReceipt(receipt: string): Promise<void> {
  window.open(receipt, "_blank", "noopener");
}

/** Aktueller Planungskurs aus app_config — dieselbe Zahl, mit der v_project_items rechnet. */
export const useEurRate = () =>
  useQuery({
    queryKey: ["admin", "eur-rate"] as const,
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "eur_ugx_rate")
        .maybeSingle();
      if (error) throw new Error(error.message);
      const rate = Number(data?.value);
      return Number.isFinite(rate) && rate > 0 ? rate : null;
    },
  });

/** Angemeldet heisst noch nicht freigeschaltet — die Freigabeliste entscheidet. */
export const useIsAppMember = (enabled: boolean) =>
  useQuery({
    queryKey: ["admin", "is-member"] as const,
    enabled,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("is_app_member");
      if (error) throw new Error(error.message);
      return data === true;
    },
  });

/** Projekte und Phasen fuer die Filter und fuer das Anlegen neuer Positionen. */
export const useProjects = () =>
  useQuery({
    queryKey: ["admin", "projects"] as const,
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase.from("projects").select("project_id, name").order("project_id");
      if (error) throw new Error(error.message);
      return (data ?? []) as Project[];
    },
  });

export const usePhases = () =>
  useQuery({
    queryKey: ["admin", "phases"] as const,
    queryFn: async (): Promise<Phase[]> => {
      const { data, error } = await supabase
        .from("project_phase_translations")
        .select("phase_id, phase_de")
        .order("phase_de");
      if (error) throw new Error(error.message);
      return (data ?? []) as Phase[];
    },
  });

export interface NewProjectItem {
  projectId: string;
  phaseId: string;
  titleDe: string;
  titleEn: string | null;
  qtyNeeded: number;
  unitCostUgx: number;
}

/** Legt Position und Uebersetzung in einem Aufruf an und gibt die neue ID zurueck. */
export const useCreateProjectItem = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewProjectItem): Promise<string> => {
      const { data, error } = await supabase.rpc("create_project_item", {
        p_project_id: input.projectId,
        p_phase_id: input.phaseId,
        p_title_de: input.titleDe,
        p_qty_needed: input.qtyNeeded,
        p_unit_cost_ugx: input.unitCostUgx,
        p_title_en: input.titleEn,
      });
      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.items }),
  });
};

export interface TransferPatch {
  buchung_nr?: number | null;
  zweck?: string | null;
  original_amount?: number | null;
  original_currency?: string | null;
  exchange_rate?: number | null;
}

/**
 * Bearbeitet die Buchungsangaben einer Überweisung.
 *
 * Adressiert wird über transaction_id, nicht über die Referenz: vier Altzeilen
 * haben keine, und die Referenz ist nicht der Schlüssel der Tabelle.
 */
export const useUpdateTransfer = (transferId: string) => {
  const refresh = useRefresh(transferId);
  return useMutation({
    mutationFn: async ({ transactionId, patch }: { transactionId: string; patch: TransferPatch }) => {
      const { error } = await supabase
        .from("transactions")
        .update(patch)
        .eq("transaction_id", transactionId);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};
