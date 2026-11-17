import { describe, expect, it } from "vitest";
import type { CartItem } from "@/contexts/cartReducer";
import {
  endbetragDerSpende,
  formatBankTransferReference,
  formatFormSubmitErrorDetail,
  getDonationDonorDisplayName,
  strasseUndHausnummer,
} from "./donationHelpers";

// Reine Helfer des Spendenformulars: Betrag, Verwendungszweck, Spendername, Anschrift und die
// Fehlermeldung von form-submit (alma-data-platform).

const position = (felder: Partial<CartItem>): CartItem => ({
  id: "item-CH-001",
  type: "item",
  name: "Zementsack",
  description: "",
  unitPrice: 12.5,
  quantity: 1,
  totalPrice: 12.5,
  category: "",
  ...felder,
});

describe("endbetragDerSpende – monatlich", () => {
  it("nimmt den gewählten Betrag, sonst den eigenen", () => {
    expect(endbetragDerSpende({ donationType: "monthly", amount: "25", customAmount: "", items: [], totalAmount: 0 })).toBe(25);
    expect(endbetragDerSpende({ donationType: "monthly", amount: "", customAmount: "17.50", items: [], totalAmount: 0 })).toBe(17.5);
  });

  it("zieht den gewählten Betrag dem eigenen vor", () => {
    expect(endbetragDerSpende({ donationType: "monthly", amount: "25", customAmount: "40", items: [], totalAmount: 0 })).toBe(25);
  });

  it("ignoriert den Warenkorb", () => {
    const items = [position({ totalPrice: 30.3 })];
    expect(endbetragDerSpende({ donationType: "monthly", amount: "10", customAmount: "", items, totalAmount: 30.3 })).toBe(10);
  });

  it("liefert ohne Betrag 0 – der Aufrufer meldet dann „Betrag fehlt“", () => {
    expect(endbetragDerSpende({ donationType: "monthly", amount: "", customAmount: "", items: [], totalAmount: 0 })).toBe(0);
  });

  it("rundet einen eigenen Betrag nicht auf Cent – Befund, offen", () => {
    // Das Eingabefeld (type="number", step="0.01") lässt 12.345 zu; Stripe rundet selbst auf Cent,
    // an form-submit geht 12.345. Nur der Warenkorb rechnet in Cent (cartReducer.ts).
    expect(endbetragDerSpende({ donationType: "monthly", amount: "", customAmount: "12.345", items: [], totalAmount: 0 })).toBe(12.345);
  });

  it("liefert NaN bei nicht lesbarer Eingabe – der Aufrufer prüft isNaN", () => {
    expect(endbetragDerSpende({ donationType: "monthly", amount: "", customAmount: "abc", items: [], totalAmount: 0 })).toBeNaN();
  });
});

describe("endbetragDerSpende – einmalig", () => {
  it("nimmt die Summe des Warenkorbs vor einem gewählten Betrag", () => {
    const items = [position({ totalPrice: 10.1 }), position({ id: "general-donation", type: "general-donation", totalPrice: 20.2 })];
    expect(endbetragDerSpende({ donationType: "one-time", amount: "50", customAmount: "", items, totalAmount: 30.3 })).toBe(30.3);
  });

  it("rechnet bei veralteter Summe 0 aus den Positionen nach, in ganzen Cent", () => {
    const items = [position({ totalPrice: 10.1 }), position({ id: "item-CH-002", totalPrice: 20.2 })];
    expect(endbetragDerSpende({ donationType: "one-time", amount: "", customAmount: "", items, totalAmount: 0 })).toBe(30.3);
  });

  it("nimmt Menge × Stückpreis, wenn eine Position keine Summe trägt", () => {
    const items = [position({ unitPrice: 0.1, quantity: 3, totalPrice: 0 })];
    expect(endbetragDerSpende({ donationType: "one-time", amount: "", customAmount: "", items, totalAmount: Number.NaN })).toBe(0.3);
  });

  it("zählt eine Position ohne lesbaren Preis als 0", () => {
    const items = [position({ unitPrice: Number.NaN, totalPrice: 0 }), position({ id: "item-CH-002", totalPrice: 8 })];
    expect(endbetragDerSpende({ donationType: "one-time", amount: "", customAmount: "", items, totalAmount: 0 })).toBe(8);
  });

  it("fällt auf den gewählten Betrag zurück, wenn der Warenkorb nur 0 € enthält", () => {
    const items = [position({ unitPrice: 0, totalPrice: 0 })];
    expect(endbetragDerSpende({ donationType: "one-time", amount: "50", customAmount: "", items, totalAmount: 0 })).toBe(50);
  });

  it("nimmt ohne Warenkorb den gewählten oder eigenen Betrag", () => {
    expect(endbetragDerSpende({ donationType: "one-time", amount: "100", customAmount: "", items: [], totalAmount: 0 })).toBe(100);
    expect(endbetragDerSpende({ donationType: "one-time", amount: "", customAmount: "7.5", items: [], totalAmount: 0 })).toBe(7.5);
  });

  it("gibt eine negative Eingabe unverändert weiter – der Aufrufer weist ≤ 0 ab", () => {
    expect(endbetragDerSpende({ donationType: "one-time", amount: "", customAmount: "-5", items: [], totalAmount: 0 })).toBe(-5);
  });

  it("behandelt einen unbekannten Typ wie einmalig", () => {
    const items = [position({ totalPrice: 12.5 })];
    expect(endbetragDerSpende({ donationType: "", amount: "", customAmount: "", items, totalAmount: 12.5 })).toBe(12.5);
  });
});

describe("formatBankTransferReference", () => {
  it("baut den Verwendungszweck ALMA-{intentId} (Vertrag mit alma-data-platform)", () => {
    expect(formatBankTransferReference("3f6c1a52-8d3e-4b7a-9c11-2e5f0a7b9d40")).toBe("ALMA-3f6c1a52-8d3e-4b7a-9c11-2e5f0a7b9d40");
  });
});

describe("getDonationDonorDisplayName", () => {
  it("setzt Vor- und Nachname zusammen, ohne Leerzeichen am Rand", () => {
    expect(getDonationDonorDisplayName({ donorType: "private", firstName: " Erika ", lastName: " Muster ", companyName: "Firma" })).toBe(
      "Erika Muster",
    );
  });

  it("nimmt bei nur einem Namen keinen Leerraum mit", () => {
    expect(getDonationDonorDisplayName({ donorType: "private", firstName: "", lastName: "Muster", companyName: "" })).toBe("Muster");
    expect(getDonationDonorDisplayName({ donorType: "private", firstName: "Erika", lastName: "  ", companyName: "" })).toBe("Erika");
  });

  it("nimmt bei Firmen nur den Firmennamen", () => {
    expect(getDonationDonorDisplayName({ donorType: "company", firstName: "Erika", lastName: "Muster", companyName: " Muster GmbH " })).toBe(
      "Muster GmbH",
    );
  });

  it("liefert ohne Namen einen Leerstring", () => {
    expect(getDonationDonorDisplayName({ donorType: "company", firstName: "Erika", lastName: "", companyName: "" })).toBe("");
  });
});

describe("strasseUndHausnummer", () => {
  it.each([
    ["Hauptstraße 12", "Hauptstraße", "12"],
    ["Hauptstraße 12a", "Hauptstraße", "12a"],
    ["Am Markt 3-5", "Am Markt", "3-5"],
    ["Lindenweg 4/1", "Lindenweg", "4/1"],
    ["Hauptstraße,12", "Hauptstraße", "12"],
    ["Straße des 17. Juni 135", "Straße des 17. Juni", "135"],
    ["  Kampala Road 12B  ", "Kampala Road", "12B"],
  ])("trennt „%s“ in „%s“ und „%s“", (eingabe, strasse, nummer) => {
    expect(strasseUndHausnummer(eingabe)).toEqual({ street: strasse, houseNumber: nummer });
  });

  it.each([
    ["12 Main Street"],
    ["Plot 45, Mukono Road"],
    ["Hauptstr.12"],
    ["Hauptstraße 12 a"],
    ["Postfach"],
  ])("lässt „%s“ ohne erkennbare Hausnummer am Ende ganz als Straße stehen", (eingabe) => {
    expect(strasseUndHausnummer(eingabe)).toEqual({ street: eingabe, houseNumber: "" });
  });

  it("behält bei „Hauptstraße, 12“ das Komma in der Straße – Grenzfall", () => {
    expect(strasseUndHausnummer("Hauptstraße, 12")).toEqual({ street: "Hauptstraße,", houseNumber: "12" });
  });

  it("nimmt eine reine Zahl als Straße, nicht als Hausnummer", () => {
    expect(strasseUndHausnummer("12")).toEqual({ street: "12", houseNumber: "" });
  });

  it("liefert für leere Eingabe zwei Leerstrings", () => {
    expect(strasseUndHausnummer("   ")).toEqual({ street: "", houseNumber: "" });
  });
});

describe("formatFormSubmitErrorDetail", () => {
  it("nimmt den Fehlercode von form-submit", () => {
    expect(formatFormSubmitErrorDetail({ ok: false, error: "gift_message_too_long" })).toBe("gift_message_too_long");
  });

  it("schreibt ein verschachteltes Fehlerobjekt als JSON statt [object Object]", () => {
    expect(formatFormSubmitErrorDetail({ error: { code: "23505", message: "duplicate key" } })).toBe(
      '{"code":"23505","message":"duplicate key"}',
    );
  });

  it("nimmt sonst message, dann code", () => {
    expect(formatFormSubmitErrorDetail({ message: "Function not found" })).toBe("Function not found");
    expect(formatFormSubmitErrorDetail({ code: 503 })).toBe("503");
    expect(formatFormSubmitErrorDetail({ code: "BOOT_ERROR" })).toBe("BOOT_ERROR");
    expect(formatFormSubmitErrorDetail({ error: null, message: "Zeitüberschreitung" })).toBe("Zeitüberschreitung");
  });

  it("schreibt ein unbekanntes Objekt ganz als JSON", () => {
    expect(formatFormSubmitErrorDetail({ ok: false })).toBe('{"ok":false}');
    expect(formatFormSubmitErrorDetail([])).toBe("[]");
  });

  it("gibt Text unverändert zurück und alles andere als Leerstring", () => {
    expect(formatFormSubmitErrorDetail("Bad Gateway")).toBe("Bad Gateway");
    expect(formatFormSubmitErrorDetail(null)).toBe("");
    expect(formatFormSubmitErrorDetail(undefined)).toBe("");
    expect(formatFormSubmitErrorDetail(502)).toBe("");
  });
});
