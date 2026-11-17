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

  it("ordnet „Waisenhaus in Mukono“ dem Waisenhaus zu, nicht über „haus“ dem Community House", () => {
    // „haus“ steht nur als Teil von „waisenhaus“ im Titel und zählt deshalb nicht.
    expect(treffer("Waisenhaus in Mukono")).toBe("Orphanage & Women's Home");
  });

  it("ordnet „Landwirtschaft & Bauerngruppe“ wie den englischen Titel der Farm zu", () => {
    expect(treffer("Landwirtschaft & Bauerngruppe")).toBe("Farm");
  });

  it.each([
    ["Building the Community House", "Community House"],
    ["Well Construction", "Well"],
    ["Agriculture Project", "Farm"],
  ])("ordnet den Namen „%s“ aus CartSidebar „%s“ zu", (titel, erwartet) => {
    expect(treffer(titel)).toBe(erwartet);
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
    "Education Support",
    "Mobility Project",
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

describe("findeProjektKosten – spezifische vor allgemeinen Schlagwörtern", () => {
  it("lässt „haus“ nicht greifen, wenn es nur in „waisenhaus“ steckt, auch wenn das Community House zuerst kommt", () => {
    const kosten = ["Community House", "Orphanage"].map(projekt);
    expect(treffer("Neues Waisenhaus", kosten)).toBe("Orphanage");
  });

  it("lässt „haus“ greifen, wenn es für sich steht", () => {
    expect(treffer("Gemeinschaftshaus", ["Orphanage & Women's Home", "Community House"].map(projekt))).toBe("Community House");
  });

  it("nimmt bei Schlagwörtern aus zwei Gruppen die erste Gruppe mit Treffer", () => {
    expect(treffer("Brunnen beim Waisenhaus", ["Well"].map(projekt))).toBe("Well");
    expect(treffer("Brunnen beim Waisenhaus", ["Orphanage"].map(projekt))).toBe("Orphanage");
  });

  it("findet ohne Waisenhaus-Projekt nichts statt auf das Community House auszuweichen", () => {
    expect(treffer("Waisenhaus in Mukono", ["Community House", "Well"].map(projekt))).toBeNull();
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
