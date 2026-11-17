import { describe, expect, it } from "vitest";
import { parseAmount } from "./format";

// Betragseingabe im Verwaltungsbereich: englische Schreibweise, Komma = Tausendertrenner.
describe("parseAmount", () => {
  it("liest Tausendertrenner und Dezimalpunkt", () => {
    expect(parseAmount("1,234.56")).toBe(1234.56);
  });

  it("ignoriert Leerzeichen", () => {
    expect(parseAmount(" 2 500 ")).toBe(2500);
  });

  it("gibt bei leerer Eingabe null zurück", () => {
    expect(parseAmount("   ")).toBeNull();
  });

  it("gibt bei Text null zurück statt NaN", () => {
    expect(parseAmount("abc")).toBeNull();
  });

  it("liest deutsche Schreibweise falsch – so dokumentiert, nicht korrigiert", () => {
    // "1.234,56" wird zu "1.23456": Das Komma fällt als Tausendertrenner weg.
    expect(parseAmount("1.234,56")).toBe(1.23456);
  });
});
