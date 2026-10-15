// Projektpositionen mit Bedarf und finanzierter Menge für die öffentliche Projektseite.
// Quelle ist die Supabase-Funktion website_projektpositionen (alma-data-platform, Migration 627).
// Bis 10/2026 kamen die Zahlen aus dem Google Sheet „DO NOT TOUCH_Website_Spendenshop“,
// das von Hand gepflegt wurde und der Datenbank weit hinterherlief.

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface ProjectItem {
  itemId: string;
  project: string;
  phase: string;
  category: string;
  displayName: string;
  unit: string;
  unitCostUGX: number;
  unitCostEUR: number;
  qtyNeededTotal: number;
  qtyFunded: number;
  priority: string;
  blurb: string;
  imageUrl: string;
  visibility: string;
  sortOrder: number;
  purchased?: boolean;
  totalCostEUR?: number;
  fundedCostEUR?: number;
  // German translations (optional)
  phaseDe?: string;
  displayNameDe?: string;
  categoryDe?: string;
  blurbDe?: string;
}

export interface ProjectCost {
  projectName: string;
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  currency: string;
  items: ProjectItem[];
  totalItems: number;
  purchasedItems: number;
}

interface PositionRow {
  item_id: string;
  project: string;
  phase_en: string;
  phase_de: string;
  title_en: string;
  title_de: string;
  description_en: string | null;
  description_de: string | null;
  priority: string | null;
  unit_cost_ugx: number;
  unit_cost_eur: number;
  qty_needed: number;
  qty_funded: number;
  sort_order: number;
  /** Finanzierter Teil in EUR: zugeordnet zum Kurs des Transfers, belegt zum aktuellen Kurs. */
  funded_eur?: number | null;
}

const toItem = (row: PositionRow): ProjectItem => {
  const unitCostEUR = Number(row.unit_cost_eur);
  const qtyNeededTotal = Number(row.qty_needed);
  const qtyFunded = Number(row.qty_funded);
  // Bezahltes zum Kurs, zu dem es bezahlt wurde; der Stueckpreis (aktueller Kurs) gilt nur
  // fuer den offenen Teil. Gesamt ist beides zusammen, damit "offen" genau der offene Teil bleibt.
  const fundedCostEUR = row.funded_eur != null ? Number(row.funded_eur) : unitCostEUR * qtyFunded;
  return {
    itemId: row.item_id,
    project: row.project,
    phase: row.phase_en,
    category: "",
    displayName: row.title_en,
    unit: "Stück",
    unitCostUGX: Number(row.unit_cost_ugx),
    unitCostEUR,
    qtyNeededTotal,
    qtyFunded,
    priority: row.priority ?? "",
    blurb: row.description_en ?? "",
    imageUrl: "",
    visibility: "true",
    sortOrder: Number(row.sort_order),
    purchased: qtyFunded >= qtyNeededTotal,
    totalCostEUR: fundedCostEUR + unitCostEUR * Math.max(qtyNeededTotal - qtyFunded, 0),
    fundedCostEUR,
    phaseDe: row.phase_de,
    displayNameDe: row.title_de,
    blurbDe: row.description_de ?? undefined,
  };
};

export const fetchProjectCosts = async (): Promise<ProjectCost[]> => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).");
  }

  const { data, error } = await supabase.rpc("website_projektpositionen");
  if (error) throw new Error(`Failed to fetch project costs: ${error.message}`);

  const byProject = new Map<string, ProjectItem[]>();
  for (const item of ((data ?? []) as PositionRow[]).map(toItem)) {
    byProject.set(item.project, [...(byProject.get(item.project) ?? []), item]);
  }

  return Array.from(byProject, ([projectName, items]) => {
    const totalBudget = items.reduce((sum, item) => sum + (item.totalCostEUR || 0), 0);
    const spentAmount = items.reduce((sum, item) => sum + (item.fundedCostEUR || 0), 0);
    return {
      projectName,
      totalBudget,
      spentAmount,
      remainingAmount: totalBudget - spentAmount,
      currency: "EUR",
      items,
      totalItems: items.length,
      purchasedItems: items.filter((item) => item.purchased).length,
    };
  });
};
