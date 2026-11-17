import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchProjectCosts } from "./projectCostsService";

// Projektpositionen der öffentlichen Projektseite aus der RPC website_projektpositionen
// (alma-data-platform). Ersetzt ist nur die Grenze supabase-js: rpc() liefert hier dieselbe Form
// { data, error } wie der echte Client, es geht keine Anfrage hinaus.

const grenze = vi.hoisted(() => ({ konfiguriert: true, rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  get isSupabaseConfigured() {
    return grenze.konfiguriert;
  },
  supabase: { rpc: grenze.rpc },
}));

type Zeile = Record<string, unknown>;

const zeile = (felder: Zeile): Zeile => ({
  item_id: "CH-001",
  project: "Building the Community House",
  phase_en: "Foundation",
  phase_de: "Fundament",
  title_en: "Cement bag",
  title_de: "Zementsack",
  description_en: "50 kg bag",
  description_de: "Sack zu 50 kg",
  priority: "high",
  unit_cost_ugx: 45000,
  unit_cost_eur: 12.5,
  qty_needed: 10,
  qty_funded: 4,
  sort_order: 1,
  funded_eur: null,
  ...felder,
});

const liefert = (data: Zeile[] | null) => grenze.rpc.mockResolvedValue({ data, error: null });

beforeEach(() => {
  grenze.konfiguriert = true;
  grenze.rpc.mockReset();
});

describe("fetchProjectCosts – Abruf", () => {
  it("ruft die RPC website_projektpositionen ohne Parameter", async () => {
    liefert([]);
    await fetchProjectCosts();
    expect(grenze.rpc).toHaveBeenCalledTimes(1);
    expect(grenze.rpc).toHaveBeenCalledWith("website_projektpositionen");
  });

  it("wirft mit der Meldung der Datenbank, statt eine leere Liste zu liefern", async () => {
    grenze.rpc.mockResolvedValue({
      data: null,
      error: { message: "permission denied for function website_projektpositionen", details: "", hint: "", code: "42501" },
    });
    await expect(fetchProjectCosts()).rejects.toThrow(
      "Failed to fetch project costs: permission denied for function website_projektpositionen",
    );
  });

  it("wirft ohne Konfiguration und fragt die Datenbank gar nicht erst", async () => {
    grenze.konfiguriert = false;
    await expect(fetchProjectCosts()).rejects.toThrow("Supabase is not configured");
    expect(grenze.rpc).not.toHaveBeenCalled();
  });

  it("liefert bei data = null eine leere Liste", async () => {
    liefert(null);
    await expect(fetchProjectCosts()).resolves.toEqual([]);
  });
});

describe("fetchProjectCosts – Position (toItem)", () => {
  it("übernimmt Felder und Übersetzungen der Zeile", async () => {
    liefert([zeile({})]);
    const [projekt] = await fetchProjectCosts();
    expect(projekt.items[0]).toEqual({
      itemId: "CH-001",
      project: "Building the Community House",
      phase: "Foundation",
      category: "",
      displayName: "Cement bag",
      unit: "Stück",
      unitCostUGX: 45000,
      unitCostEUR: 12.5,
      qtyNeededTotal: 10,
      qtyFunded: 4,
      priority: "high",
      blurb: "50 kg bag",
      imageUrl: "",
      visibility: "true",
      sortOrder: 1,
      purchased: false,
      // 4 × 12,50 finanziert + 6 × 12,50 offen
      totalCostEUR: 125,
      fundedCostEUR: 50,
      phaseDe: "Fundament",
      displayNameDe: "Zementsack",
      blurbDe: "Sack zu 50 kg",
    });
  });

  it("liest Zahlen auch als Text (numeric aus Postgres) und leere Texte als Leerstring", async () => {
    liefert([
      zeile({
        unit_cost_ugx: "45000.00",
        unit_cost_eur: "12.35",
        qty_needed: "3",
        qty_funded: "1",
        sort_order: "7",
        funded_eur: "11.90",
        priority: null,
        description_en: null,
        description_de: null,
      }),
    ]);
    const [projekt] = await fetchProjectCosts();
    expect(projekt.items[0]).toMatchObject({
      unitCostUGX: 45000,
      unitCostEUR: 12.35,
      qtyNeededTotal: 3,
      qtyFunded: 1,
      sortOrder: 7,
      fundedCostEUR: 11.9,
      totalCostEUR: 36.6, // 11,90 finanziert + 2 × 12,35 offen
      priority: "",
      blurb: "",
      blurbDe: undefined,
    });
  });

  it("nimmt den finanzierten Teil aus funded_eur (Kurs des Transfers), nicht Menge × heutiger Stückpreis", async () => {
    // 4 Stück zum alten Kurs bezahlt: 46,00 € statt 4 × 12,50 = 50,00 €. Offen bleiben 6 × 12,50.
    liefert([zeile({ funded_eur: 46 })]);
    const [projekt] = await fetchProjectCosts();
    expect(projekt.items[0]).toMatchObject({ fundedCostEUR: 46, totalCostEUR: 46 + 75 });
    expect(projekt).toMatchObject({ totalBudget: 121, spentAmount: 46, remainingAmount: 75 });
  });

  it("nimmt funded_eur = 0 als 0, nicht als fehlend", async () => {
    liefert([zeile({ qty_funded: 4, funded_eur: 0 })]);
    const [projekt] = await fetchProjectCosts();
    expect(projekt.items[0]).toMatchObject({ fundedCostEUR: 0, totalCostEUR: 75 });
  });

  it("rechnet ohne funded_eur (alte RPC-Fassung) mit Menge × Stückpreis", async () => {
    const ohneFeld = zeile({});
    delete ohneFeld.funded_eur;
    liefert([ohneFeld]);
    const [projekt] = await fetchProjectCosts();
    expect(projekt.items[0]).toMatchObject({ fundedCostEUR: 50, totalCostEUR: 125 });
  });

  it("markiert eine voll finanzierte Position als gekauft, offen ist dann 0", async () => {
    liefert([zeile({ qty_funded: 10, funded_eur: 125 })]);
    const [projekt] = await fetchProjectCosts();
    expect(projekt.items[0]).toMatchObject({ purchased: true, fundedCostEUR: 125, totalCostEUR: 125 });
    expect(projekt).toMatchObject({ remainingAmount: 0, purchasedItems: 1 });
  });

  it("zählt bei überfinanzierter Menge keinen negativen offenen Teil", async () => {
    // Die RPC deckelt qty_funded heute selbst (least(qty_needed, qty_paid)); toItem hält trotzdem.
    liefert([zeile({ qty_needed: 2, qty_funded: 3, funded_eur: 37.5 })]);
    const [projekt] = await fetchProjectCosts();
    expect(projekt.items[0]).toMatchObject({ purchased: true, totalCostEUR: 37.5 });
    expect(projekt.remainingAmount).toBe(0);
  });

  it("zeigt eine Position ohne Bedarf (Menge 0) als gekauft mit Budget 0", async () => {
    liefert([zeile({ qty_needed: 0, qty_funded: 0, funded_eur: 0 })]);
    const [projekt] = await fetchProjectCosts();
    expect(projekt.items[0]).toMatchObject({ purchased: true, fundedCostEUR: 0, totalCostEUR: 0 });
  });
});

describe("fetchProjectCosts – Summen je Projekt", () => {
  it("gruppiert nach Projekt in der Reihenfolge der Zeilen und summiert in EUR", async () => {
    liefert([
      zeile({ item_id: "CH-001", unit_cost_eur: 12.5, qty_needed: 10, qty_funded: 4, funded_eur: 46 }),
      zeile({ item_id: "W-001", project: "Well Construction", unit_cost_eur: 250, qty_needed: 1, qty_funded: 0, funded_eur: 0 }),
      zeile({ item_id: "CH-002", unit_cost_eur: 8, qty_needed: 5, qty_funded: 5, funded_eur: 40 }),
    ]);
    const projekte = await fetchProjectCosts();

    expect(projekte.map((p) => p.projectName)).toEqual(["Building the Community House", "Well Construction"]);
    expect(projekte[0].items.map((i) => i.itemId)).toEqual(["CH-001", "CH-002"]);
    expect(projekte[0]).toMatchObject({
      // CH-001: 46 + 6 × 12,50 = 121; CH-002: 40 + 0 = 40
      totalBudget: 161,
      spentAmount: 86,
      remainingAmount: 75,
      currency: "EUR",
      totalItems: 2,
      purchasedItems: 1,
    });
    expect(projekte[1]).toMatchObject({
      totalBudget: 250,
      spentAmount: 0,
      remainingAmount: 250,
      totalItems: 1,
      purchasedItems: 0,
    });
  });
});
