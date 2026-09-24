import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AccountCheck, CashflowRow, CoverageRow, DuesAccount, ForecastRow, MonthBalance, PlannedCost, PlannedIncome } from "./types";

export const financeKeys = {
  monatsbilanz: ["admin", "finance", "monatsbilanz"] as const,
  kontoabgleich: ["admin", "finance", "kontoabgleich"] as const,
  beitragskonto: ["admin", "finance", "beitragskonto"] as const,
  vorschau: ["admin", "finance", "vorschau"] as const,
  planEinnahmen: ["admin", "finance", "plan-einnahmen"] as const,
  erwartung: ["admin", "finance", "erwartung"] as const,
  liquiditaet: ["admin", "finance", "liquiditaet"] as const,
  planAusgaben: ["admin", "finance", "plan-ausgaben"] as const,
};

/** Monatsbilanz, juengster Monat zuerst. */
export const useMonthBalances = () =>
  useQuery({
    queryKey: financeKeys.monatsbilanz,
    queryFn: async (): Promise<MonthBalance[]> => {
      const { data, error } = await supabase
        .from("v_monatsbilanz")
        .select("monat, einnahmen, ausgaben, spendentransfer, transfergebuehren, umbuchungen, netto, buchungen, bestand")
        .order("monat", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as MonthBalance[];
    },
  });

export const useAccountChecks = () =>
  useQuery({
    queryKey: financeKeys.kontoabgleich,
    queryFn: async (): Promise<AccountCheck[]> => {
      const { data, error } = await supabase
        .from("v_kontoabgleich")
        .select("konto, stichtag, saldo_gemessen, summe_gebucht, startsaldo_implizit, buchungen, notiz")
        .order("konto");
      if (error) throw new Error(error.message);
      return (data ?? []) as AccountCheck[];
    },
  });

export const useDuesAccounts = () =>
  useQuery({
    queryKey: financeKeys.beitragskonto,
    queryFn: async (): Promise<DuesAccount[]> => {
      const { data, error } = await supabase.from("v_beitragskonto").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []) as DuesAccount[];
    },
  });

export const useForecast = () =>
  useQuery({
    queryKey: financeKeys.vorschau,
    queryFn: async (): Promise<ForecastRow[]> => {
      const { data, error } = await supabase.from("v_finanzvorschau").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []) as ForecastRow[];
    },
  });


export const usePlannedIncome = () =>
  useQuery({
    queryKey: financeKeys.planEinnahmen,
    queryFn: async (): Promise<PlannedIncome[]> => {
      const { data, error } = await supabase
        .from("plan_einnahmen")
        .select("plan_id, bezeichnung, kategorie, betrag_eur, rhythmus, von_datum, bis_datum, sicherheit, contact_id, project_id, kommentar")
        .order("bezeichnung");
      if (error) throw new Error(error.message);
      return (data ?? []) as PlannedIncome[];
    },
  });


/**
 * Erwartete Einnahmen des laufenden Monats, nach Sicherheit getrennt.
 * Die View liefert 24 Monate; fuer die Kacheln zaehlt der aktuelle.
 */
export const useExpectedThisMonth = () =>
  useQuery({
    queryKey: financeKeys.erwartung,
    queryFn: async (): Promise<{ fix: number; erwartet: number }> => {
      const monatsanfang = new Date();
      monatsanfang.setUTCDate(1);
      const schluessel = monatsanfang.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("v_einnahmen_erwartung")
        .select("sicherheit, betrag")
        .eq("monat", schluessel);
      if (error) throw new Error(error.message);
      const zeilen = (data ?? []) as { sicherheit: string; betrag: number }[];
      const summe = (filter: (s: string) => boolean) =>
        zeilen.filter((z) => filter(z.sicherheit)).reduce((sum, z) => sum + Number(z.betrag), 0);
      return {
        fix: summe((s) => s === "fix"),
        erwartet: summe((s) => s === "fix" || s === "wahrscheinlich"),
      };
    },
  });


export const usePlannedCosts = () =>
  useQuery({
    queryKey: financeKeys.planAusgaben,
    queryFn: async (): Promise<PlannedCost[]> => {
      const { data, error } = await supabase
        .from("plan_ausgaben")
        .select("plan_id, bezeichnung, kategorie, betrag_eur, rhythmus, von_datum, bis_datum, project_id, kommentar")
        .order("kategorie")
        .order("bezeichnung");
      if (error) throw new Error(error.message);
      return (data ?? []) as PlannedCost[];
    },
  });

/** Betrag einer Ausgabenzeile aendern — dieselbe Zurueckhaltung wie bei den Einnahmen. */
export const useUpdateCostAmount = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, betrag }: { planId: string; betrag: number }) => {
      const { error } = await supabase.from("plan_ausgaben").update({ betrag_eur: betrag }).eq("plan_id", planId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: financeKeys.planAusgaben });
      void client.invalidateQueries({ queryKey: financeKeys.liquiditaet });
      void client.invalidateQueries({ queryKey: financeKeys.vorschau });
    },
  });
};

/**
 * Betrag einer Planzeile aendern. Alles andere — Rhythmus, Zeitraum, Sicherheit —
 * bleibt der Datenbank vorbehalten, solange es dafuer keine Maske gibt: ein halb
 * gepflegter Plan ist schlechter als einer, den man bewusst in SQL anfasst.
 */
export const useUpdatePlannedAmount = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, betrag }: { planId: string; betrag: number }) => {
      const { error } = await supabase
        .from("plan_einnahmen")
        .update({ betrag_eur: betrag })
        .eq("plan_id", planId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: financeKeys.planEinnahmen });
      void client.invalidateQueries({ queryKey: financeKeys.erwartung });
      void client.invalidateQueries({ queryKey: financeKeys.vorschau });
      void client.invalidateQueries({ queryKey: financeKeys.liquiditaet });
    },
  });
};

/** Eingaenge und Ausgaenge je Monat, gemessen und gerechnet auf einer Zeitachse. */
export const useCashflow = () =>
  useQuery({
    queryKey: [...financeKeys.erwartung, "verlauf"] as const,
    queryFn: async (): Promise<CashflowRow[]> => {
      const { data, error } = await supabase
        .from("v_finanzverlauf")
        .select("monat, richtung, art, gemessen, betrag")
        .order("monat");
      if (error) throw new Error(error.message);
      return (data ?? []) as CashflowRow[];
    },
  });

/** Bestand auf allen Konten je Monat — gemessen bis heute, danach fortgeschrieben. */
export const useAccountCoverage = () =>
  useQuery({
    queryKey: [...financeKeys.erwartung, "deckung"] as const,
    queryFn: async (): Promise<CoverageRow[]> => {
      const { data, error } = await supabase
        .from("v_kontodeckung")
        .select("monat, bestand, gemessen")
        .order("monat");
      if (error) throw new Error(error.message);
      return (data ?? []) as CoverageRow[];
    },
  });
