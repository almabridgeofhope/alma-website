import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "./queries";
import type { PlannedTransfer, PlannedTransferItem } from "./types";

const PLAN_COLUMNS =
  "plan_transfer_id, geplant_fuer, faellig_monat, ueberfaellig, bezeichnung, status, kommentar, positionen, ugx_geplant, eur_geplant, eur_wirksam, transaction_id, external_transaction_id, ist_datum, ist_eur, ausgefuehrt_am, created_at";
const PLAN_ITEM_COLUMNS =
  "plan_transfer_id, item_id, projekt, phase, item_name, status, faellig_monat, qty_geplant, qty_wirksam, betrag_ugx, ugx_geplant, ugx_wirksam, eur_geplant, eur_wirksam";

export const planKeys = {
  plans: ["admin", "plans"] as const,
  items: ["admin", "plans", "items"] as const,
};

/** Alle Plaene, verworfene eingeschlossen — die Seiten filtern selbst. */
export const usePlannedTransfers = () =>
  useQuery({
    queryKey: planKeys.plans,
    queryFn: async (): Promise<PlannedTransfer[]> => {
      const { data, error } = await supabase
        .from("v_plan_transfers")
        .select(PLAN_COLUMNS)
        .order("geplant_fuer")
        .order("plan_transfer_id");
      if (error) throw new Error(error.message);
      return (data ?? []) as PlannedTransfer[];
    },
  });

/**
 * Alle Planpositionen auf einmal: die Detailseite braucht die eigenen, der
 * Positionsdialog die der anderen Plaene, um zu zeigen, was schon verplant ist.
 */
export const usePlannedTransferItems = () =>
  useQuery({
    queryKey: planKeys.items,
    queryFn: async (): Promise<PlannedTransferItem[]> => {
      const { data, error } = await supabase
        .from("v_plan_transfer_positionen")
        .select(PLAN_ITEM_COLUMNS)
        .order("item_id");
      if (error) throw new Error(error.message);
      return (data ?? []) as PlannedTransferItem[];
    },
  });

/** Verplante Menge je Position ueber alle noch offenen Plaene, wahlweise ohne einen. */
export const plannedQtyByItem = (items: PlannedTransferItem[], ohnePlan?: string): Map<string, number> => {
  const summe = new Map<string, number>();
  items
    .filter((item) => item.status === "geplant" && item.plan_transfer_id !== ohnePlan)
    .forEach((item) => summe.set(item.item_id, (summe.get(item.item_id) ?? 0) + Number(item.qty_geplant)));
  return summe;
};

/** Ein Plan wirkt auf Vorschau, Verlauf und Deckung — die Finanzseite laedt alles neu. */
const useRefresh = () => {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: planKeys.plans });
    void client.invalidateQueries({ queryKey: ["admin", "finance"] });
  };
};

export interface NewPlannedTransfer {
  /** Monatserster, wie die Datenbank ihn verlangt. */
  geplantFuer: string;
  bezeichnung: string;
  kommentar: string | null;
}

export const useCreatePlannedTransfer = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (input: NewPlannedTransfer): Promise<string> => {
      const { data, error } = await supabase
        .from("plan_transfers")
        .insert({ geplant_fuer: input.geplantFuer, bezeichnung: input.bezeichnung, kommentar: input.kommentar })
        .select("plan_transfer_id")
        .single();
      if (error) throw new Error(error.message);
      return (data as { plan_transfer_id: string }).plan_transfer_id;
    },
    onSuccess: refresh,
  });
};

export interface PlannedTransferPatch {
  geplant_fuer?: string;
  bezeichnung?: string;
  kommentar?: string | null;
  status?: "geplant" | "verworfen";
}

export const useUpdatePlannedTransfer = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ planId, patch }: { planId: string; patch: PlannedTransferPatch }) => {
      const { error } = await supabase.from("plan_transfers").update(patch).eq("plan_transfer_id", planId);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};

export const useAddPlannedItem = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (input: { planId: string; itemId: string; qty: number }) => {
      const { error } = await supabase
        .from("plan_transfer_items")
        .insert({ plan_transfer_id: input.planId, item_id: input.itemId, qty_geplant: input.qty });
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};

export const useUpdatePlannedItem = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (input: { planId: string; itemId: string; qty: number }) => {
      const { error } = await supabase
        .from("plan_transfer_items")
        .update({ qty_geplant: input.qty })
        .eq("plan_transfer_id", input.planId)
        .eq("item_id", input.itemId);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};

export const useRemovePlannedItem = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (input: { planId: string; itemId: string }) => {
      const { error } = await supabase
        .from("plan_transfer_items")
        .delete()
        .eq("plan_transfer_id", input.planId)
        .eq("item_id", input.itemId);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};

/**
 * Macht aus dem Plan Zuordnungen zur Buchung. Die Datenbank kappt die Mengen auf das
 * Offene und ueberspringt, was schon zugeordnet ist; zurueck kommt die Zahl der neuen
 * Zuordnungen.
 */
export const useCarryOutPlannedTransfer = (transferId: string) => {
  const refresh = useRefresh();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string): Promise<number> => {
      const { data, error } = await supabase.rpc("fn_plan_transfer_ausfuehren", {
        p_plan_transfer_id: planId,
        p_external_transaction_id: transferId,
      });
      if (error) throw new Error(error.message);
      return Number(data);
    },
    onSuccess: () => {
      refresh();
      void client.invalidateQueries({ queryKey: queryKeys.items });
      void client.invalidateQueries({ queryKey: queryKeys.transfers });
      void client.invalidateQueries({ queryKey: queryKeys.assignments(transferId) });
    },
  });
};

const monatsformat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export const formatPlanMonth = (value: string): string => monatsformat.format(new Date(value));

/** "2026-12" aus dem Monatsfeld wird "2026-12-01". */
export const monthInputToDate = (value: string): string => `${value}-01`;

/** Vorbelegung fuer neue Plaene: der naechste Monat. */
export const nextMonthInput = (): string => {
  const heute = new Date();
  const naechster = new Date(Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth() + 1, 1));
  return naechster.toISOString().slice(0, 7);
};
