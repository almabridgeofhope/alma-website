import { describe, expect, it } from "vitest";
import { alsEingabe, parseAmount, pruefeBetrag } from "./format";

// Betragseingabe im Verwaltungsbereich. Punkt oder Komma mit genau drei Ziffern dahinter ist ein
// Tausendertrenner, Dezimalstellen sind ein bis zwei Ziffern, Mehrdeutiges wird abgewiesen.
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
    expect(parseAmount("1e5")).toBeNull();
    expect(parseAmount("-")).toBeNull();
  });

  it("liest deutsche Schreibweise mit beiden Zeichen richtig", () => {
    expect(parseAmount("1.234,56")).toBe(1234.56);
    expect(parseAmount("1.234.567,5")).toBe(1234567.5);
  });

  it("liest negative Beträge (Buchungen werden negativ geführt)", () => {
    expect(parseAmount("-1.500,25")).toBe(-1500.25);
    expect(parseAmount("-150.000", "ugx")).toBe(-150000);
  });
});

describe("pruefeBetrag: Punkt oder Komma mit drei Ziffern ist Tausendertrenner", () => {
  it.each([
    ["150.000", 150000],
    ["150,000", 150000],
    ["1.000.000", 1000000],
    ["1,000,000", 1000000],
    ["999.999", 999999],
    ["150 000", 150000],
    ["150000", 150000],
  ])("UGX %s wird %d", (eingabe, erwartet) => {
    expect(pruefeBetrag(eingabe, "ugx")).toEqual({ ok: true, value: erwartet });
  });

  it("gilt für Euro und Mengen genauso", () => {
    expect(parseAmount("1.000", "eur")).toBe(1000);
    expect(parseAmount("2,500", "eur")).toBe(2500);
    expect(parseAmount("1.000", "zahl")).toBe(1000);
  });
});

describe("pruefeBetrag: Dezimalstellen", () => {
  it.each([
    ["12,5", 12.5],
    ["12.5", 12.5],
    ["12,50", 12.5],
    ["12.50", 12.5],
    ["0,99", 0.99],
    ["1234,56", 1234.56],
    [".5", 0.5],
  ])("EUR %s wird %d", (eingabe, erwartet) => {
    expect(pruefeBetrag(eingabe, "eur")).toEqual({ ok: true, value: erwartet });
  });

  it("Euro mit Komma und zwei Ziffern ist ein Dezimalbetrag, kein Tausender (vorher 1250)", () => {
    expect(parseAmount("12,50", "eur")).toBe(12.5);
    expect(parseAmount("1,5", "eur")).toBe(1.5);
  });

  it("UGX hat keine Dezimalstellen", () => {
    const ergebnis = pruefeBetrag("150.50", "ugx");
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) expect(ergebnis.message).toMatch(/UGX amounts are whole numbers/);
    expect(pruefeBetrag("150,5", "ugx").ok).toBe(false);
    expect(pruefeBetrag("1.234,56", "ugx").ok).toBe(false);
    expect(parseAmount("150.50", "ugx")).toBeNull();
  });

  it("Mengen und Einzelpreise dürfen zwei Dezimalstellen haben", () => {
    expect(parseAmount("2.5")).toBe(2.5);
    expect(parseAmount("33.33", "zahl")).toBe(33.33);
  });
});

describe("pruefeBetrag: mehrdeutige oder kaputte Eingaben werden abgewiesen", () => {
  it.each([
    "1.5.0",
    "12,34,56",
    "1,234,56",
    "1.234.56",
    "1,234.567,8",
    "1234.567",
    "1.2345",
    "0.500",
    "5.",
    "5,",
    ",",
    "1..000",
    "12.3a",
    "1 000.5.5",
  ])("%s", (eingabe) => {
    const ergebnis = pruefeBetrag(eingabe, "eur");
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) {
      expect(ergebnis.message).toContain(eingabe.replace(/\s/g, "").length > 0 ? eingabe.trim() : eingabe);
      expect(ergebnis.message).toMatch(/not a clear amount/);
    }
    expect(parseAmount(eingabe, "eur")).toBeNull();
  });

  it("leer ist kein Fehler, sondern value null", () => {
    expect(pruefeBetrag("", "ugx")).toEqual({ ok: true, value: null });
    expect(pruefeBetrag("  ", "eur")).toEqual({ ok: true, value: null });
  });
});

describe("pruefeBetrag: Randfälle aus dem Review", () => {
  it("UGX mit Nullen hinter dem Trennzeichen ist eine ganze Zahl", () => {
    expect(parseAmount("150.00", "ugx")).toBe(150);
    expect(parseAmount("150000,0", "ugx")).toBe(150000);
    expect(parseAmount("1.234,00", "ugx")).toBe(1234);
    expect(pruefeBetrag("150.50", "ugx").ok).toBe(false);
  });

  it("zu lange Ziffernfolgen werden abgewiesen statt Infinity oder gerundet zu werden", () => {
    expect(pruefeBetrag("9".repeat(400)).ok).toBe(false);
    expect(pruefeBetrag("9".repeat(20), "ugx").ok).toBe(false);
    expect(pruefeBetrag("9007199254740991", "ugx")).toEqual({ ok: true, value: 9007199254740991 });
  });
});

describe("alsEingabe: vorbelegte Felder lesen sich richtig zurück", () => {
  it("rundet auf zwei Stellen, damit der Wert nie wie ein Tausendertrenner aussieht", () => {
    expect(alsEingabe(0.30000000000000004)).toBe("0.3");
    expect(alsEingabe(2.125)).toBe("2.13");
    expect(alsEingabe(12)).toBe("12");
  });

  it("liefert nur Text, den pruefeBetrag unverändert zurückgibt", () => {
    for (const zahl of [0.1 + 0.2, 0.125, 2.125, 1234.5, 7, 1 / 3]) {
      const ergebnis = pruefeBetrag(alsEingabe(zahl));
      expect(ergebnis.ok).toBe(true);
      if (ergebnis.ok) expect(ergebnis.value).toBe(Math.round(zahl * 100) / 100);
    }
  });
});
