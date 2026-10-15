import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { planKeys } from "./planQueries";

/** Monatserster als "YYYY-MM-DD", wie die Datenbank ihn liefert. */
export type Monat = string;

export type ZeilenStatus = "bezahlt" | "gesendet" | "geplant" | "teilweise" | "fehlt";
export type MonatsStatus = "bezahlt" | "gesendet" | "geplant" | "teilweise" | "offen" | "ueberfaellig";

export interface AllowanceZeile {
  monat: Monat;
  item_id: string;
  item_name: string | null;
  menge: number;
  unit_cost_ugx: number | null;
  ugx: number;
  menge_bezahlt: number;
  menge_geplant: number;
  status: ZeilenStatus;
  /** "Nr. 61" oder "PTR-0006" — wo die Zeile steckt. */
  quelle: string | null;
  /** Haette spaetestens im laufenden Monat raus muessen. */
  faellig: boolean;
}

export interface AllowanceMonat {
  monat: Monat;
  status: MonatsStatus;
  zeilen: AllowanceZeile[];
  fehlend: number;
}

export interface PaketEintrag {
  item_id: string;
  gueltig_ab: Monat;
  menge: number;
}

export const allowanceKeys = {
  monate: ["admin", "allowance", "monate"] as const,
  paket: ["admin", "allowance", "paket"] as const,
};

export const naechsterMonat = (monat: Monat, schritte = 1): Monat => {
  const [jahr, mon] = monat.split("-").map(Number);
  const datum = new Date(Date.UTC(jahr, mon - 1 + schritte, 1));
  return datum.toISOString().slice(0, 10);
};

export const dieserMonat = (): Monat => {
  const jetzt = new Date();
  return `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, "0")}-01`;
};

const RANG: ZeilenStatus[] = ["fehlt", "teilweise", "geplant", "gesendet", "bezahlt"];

/** Ein Monat ist so weit wie seine schwaechste Zeile. */
const monatsStatus = (zeilen: AllowanceZeile[]): MonatsStatus => {
  const schwaechste = zeilen.reduce<ZeilenStatus>(
    (bisher, zeile) => (RANG.indexOf(zeile.status) < RANG.indexOf(bisher) ? zeile.status : bisher),
    "bezahlt",
  );
  if (schwaechste !== "fehlt") return schwaechste;
  if (zeilen.some((zeile) => zeile.status !== "fehlt")) return "teilweise";
  return zeilen[0]?.faellig ? "ueberfaellig" : "offen";
};

export const useAllowanceMonate = () =>
  useQuery({
    queryKey: allowanceKeys.monate,
    queryFn: async (): Promise<AllowanceMonat[]> => {
      const { data, error } = await supabase.from("v_allowance_monate").select("*").order("monat").order("item_id");
      if (error) throw new Error(error.message);
      const nachMonat = new Map<Monat, AllowanceZeile[]>();
      for (const zeile of (data ?? []) as AllowanceZeile[]) {
        const zeilen = nachMonat.get(zeile.monat) ?? [];
        zeilen.push({
          ...zeile,
          menge: Number(zeile.menge),
          menge_bezahlt: Number(zeile.menge_bezahlt),
          menge_geplant: Number(zeile.menge_geplant),
          ugx: Number(zeile.ugx),
        });
        nachMonat.set(zeile.monat, zeilen);
      }
      return [...nachMonat.entries()].map(([monat, zeilen]) => ({
        monat,
        zeilen,
        status: monatsStatus(zeilen),
        fehlend: zeilen.filter((zeile) => zeile.status === "fehlt" || zeile.status === "teilweise").length,
      }));
    },
  });

export const useAllowancePaket = () =>
  useQuery({
    queryKey: allowanceKeys.paket,
    queryFn: async (): Promise<PaketEintrag[]> => {
      const { data, error } = await supabase
        .from("allowance_positionen")
        .select("item_id, gueltig_ab, menge")
        .order("gueltig_ab");
      if (error) throw new Error(error.message);
      return ((data ?? []) as PaketEintrag[]).map((eintrag) => ({ ...eintrag, menge: Number(eintrag.menge) }));
    },
  });

/** Menge je Position, wie sie in einem Monat gilt (juengster Eintrag bis dahin). */
export const paketImMonat = (paket: PaketEintrag[], monat: Monat): Map<string, number> => {
  const mengen = new Map<string, number>();
  for (const eintrag of paket) {
    if (eintrag.gueltig_ab <= monat) mengen.set(eintrag.item_id, eintrag.menge);
  }
  return mengen;
};

const useRefresh = () => {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: ["admin", "allowance"] });
    void client.invalidateQueries({ queryKey: planKeys.plans });
    void client.invalidateQueries({ queryKey: ["admin", "finance"] });
  };
};

/** Plant, was dem Monat fehlt, in einen Plan des Vormonats ein — ohne Plan in einen neuen. */
export const useAllowanceEinplanen = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (input: { monat: Monat; planId: string | null }): Promise<string> => {
      const { data, error } = await supabase.rpc("fn_allowance_einplanen", {
        p_monat: input.monat,
        p_plan_transfer_id: input.planId,
      });
      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: refresh,
  });
};

export const useAllowancePaketSpeichern = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (eintraege: PaketEintrag[]) => {
      if (eintraege.length === 0) return;
      const { error } = await supabase
        .from("allowance_positionen")
        .upsert(eintraege, { onConflict: "item_id,gueltig_ab" });
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
};
