import { describe, expect, it } from "vitest";
import type { ProjectCost } from "./projectCostsService";
import { findeProjektKosten } from "./projektZuordnung";

// Die Projektseite sucht die Kosten über den angezeigten Titel (EN und DE aus LanguageContext),
// die RPC liefert die Projektnamen der Datenbank. Die vier Namen unten sind die, die
// website_projektpositionen am 17.11.2026 liefert, in ihrer Reihenfolge.

const projekt = (projectName: string): ProjectCost => ({
  projectName,
  totalBudget: 0,
  spentAmount: 0,
  remainingAmount: 0,
  currency: "EUR",
  items: [],
  totalItems: 0,
  purchasedItems: 0,
});

const ausDerDatenbank = ["Community House", "Farm", "Orphanage & Women's Home", "Well"].map(projekt);

const treffer = (titel: string, kosten: ProjectCost[] = ausDerDatenbank): string | null =>
  findeProjektKosten(kosten, titel)?.projectName ?? null;

describe("findeProjektKosten – Titel der Projektseite", () => {
  it.each([
    ["Building the Community House", "Community House"],
    ["Bau des Community House", "Community House"],
    ["Well Project", "Well"],
    ["Orphanage in Mukono", "Orphanage & Women's Home"],
  ])("ordnet „%s“ über den Teilstring „%s“ zu", (titel, erwartet) => {
    expect(treffer(titel)).toBe(erwartet);
  });

  it("ordnet „Agriculture & Farmers Group“ der Farm zu, weil „farm“ in „farmers“ steckt", () => {
    expect(treffer("Agriculture & Farmers Group")).toBe("Farm");
  });

  it("ordnet „Brunnenprojekt“ erst über das Schlagwort „brunnen“ dem Brunnen (Well) zu", () => {
    expect(treffer("Brunnenprojekt")).toBe("Well");
  });

  it("ordnet „Waisenhaus in Mukono“ dem Community House zu – Befund, offen (TESTING.md, Schicht 2)", () => {
    // Festgehalten ist das heutige Verhalten, kein Sollwert: Die Schlagwörter für „community“
    // enthalten „haus“ und werden vor „waisenhaus“ geprüft. Auf der deutschen Projektseite zeigt
    // das Waisenhaus deshalb die Kosten des Community House; richtig wäre „Orphanage & Women's Home“.
    expect(treffer("Waisenhaus in Mukono")).toBe("Community House");
  });

  it("findet für „Landwirtschaft & Bauerngruppe“ nichts (die Seite blendet die Kosten dort aus)", () => {
    expect(treffer("Landwirtschaft & Bauerngruppe")).toBeNull();
  });

  it.each([
    "Mobility & Vocational Skills",
    "Mobilität & berufliche Qualifikation",
    "Education Sponsorship Project",
    "Schulpatenschaft",
    "Financial Literacy & Education",
    "Finanzielle Allgemeinbildung",
    "Women's Craft Group",
    "Handarbeitsgruppe der Frauen",
  ])("findet für „%s“ keine Projektpositionen", (titel) => {
    expect(treffer(titel)).toBeNull();
  });
});

describe("findeProjektKosten – Reihenfolge der Regeln", () => {
  it("vergleicht exakt ohne Groß-/Kleinschreibung und Leerzeichen am Rand", () => {
    expect(treffer("  community HOUSE ")).toBe("Community House");
  });

  it("zieht den exakten Treffer einem früheren Teilstring-Treffer vor", () => {
    const kosten = ["Community House Extension", "Community House"].map(projekt);
    expect(treffer("Community House", kosten)).toBe("Community House");
  });

  it("findet per Teilstring in beide Richtungen: Titel im Projektnamen und Projektname im Titel", () => {
    expect(treffer("Orphanage")).toBe("Orphanage & Women's Home");
    expect(treffer("Well digging phase 2")).toBe("Well");
  });

  it("nimmt bei mehreren Teilstring-Treffern den ersten der Liste", () => {
    const kosten = ["Well phase 2", "Well"].map(projekt);
    expect(treffer("Well Project", kosten)).toBe("Well");
    expect(treffer("Well phase", kosten)).toBe("Well phase 2");
  });

  it("sucht über Schlagwörter nur unter Projekten, deren Name selbst ein Schlagwort enthält", () => {
    // „Water supply“ enthält „water“ aus derselben Gruppe wie „brunnen“.
    expect(treffer("Brunnenprojekt", ["Farm", "Water supply"].map(projekt))).toBe("Water supply");
    expect(treffer("Brunnenprojekt", ["Farm", "Community House"].map(projekt))).toBeNull();
  });
});

describe("findeProjektKosten – Grenzfälle", () => {
  it("liefert null, solange keine Projektpositionen geladen sind", () => {
    expect(treffer("Building the Community House", [])).toBeNull();
  });

  it("liefert bei leerem Titel das erste Projekt, weil jeder Name den Leerstring enthält", () => {
    // Heute ruft keine Stelle mit leerem Titel (CartSidebar prüft item.projectName vorher).
    expect(treffer("")).toBe("Community House");
    expect(treffer("   ")).toBe("Community House");
  });
});
