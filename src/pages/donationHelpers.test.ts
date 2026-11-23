import { describe, expect, it } from "vitest";
import type { CartItem } from "@/contexts/cartReducer";
import {
  betragMitCent,
  eigenerBetrag,
  endbetragDerSpende,
  formatBankTransferReference,
  formatFormSubmitErrorDetail,
  getDonationDonorDisplayName,
  hatNullEuroPosition,
  strasseUndHausnummer,
  ueberweisungsbetrag,
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

  it("rundet einen eigenen Betrag auf Cent wie der Warenkorb: 12,346 → 12,35", () => {
    expect(endbetragDerSpende({ donationType: "monthly", amount: "", customAmount: "12.346", items: [], totalAmount: 0 })).toBe(12.35);
    expect(endbetragDerSpende({ donationType: "monthly", amount: "12.344", customAmount: "", items: [], totalAmount: 0 })).toBe(12.34);
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

  it("rundet ohne Warenkorb den eigenen Betrag auf Cent", () => {
    expect(endbetragDerSpende({ donationType: "one-time", amount: "", customAmount: "10.555", items: [], totalAmount: 0 })).toBe(10.56);
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

describe("eigenerBetrag", () => {
  it.each([
    ["12.346", "", "12.35"],
    ["", "12.344", "12.34"],
    ["", "0.125", "0.13"],
    ["25", "", "25"],
    ["", "17.50", "17.5"],
    ["25", "40", "25"],
  ])("macht aus Auswahl „%s“ und Eingabe „%s“ den Betrag „%s“", (amount, customAmount, erwartet) => {
    expect(eigenerBetrag(amount, customAmount)).toBe(erwartet);
  });

  it("lässt leere und unlesbare Eingaben unverändert, damit die Prüfung der Aufrufer greift", () => {
    expect(eigenerBetrag("", "")).toBe("");
    expect(eigenerBetrag("", "abc")).toBe("abc");
  });

  it("rundet auf 0 bzw. negativ, die Aufrufer weisen ≤ 0 ab", () => {
    expect(eigenerBetrag("", "0.004")).toBe("0");
    expect(eigenerBetrag("", "-5.678")).toBe("-5.68");
  });

  it("gibt Stripe (Math.round auf Cent) und PayPal (toFixed(2)) denselben Betrag", () => {
    // Vorher wich PayPal bei halben Cent ab: 1,115 ergab bei Stripe 112 Cent, bei PayPal "1.11".
    for (const eingabe of ["1.115", "10.555", "12.345", "0.125", "99.99", "50"]) {
      const betrag = parseFloat(eigenerBetrag("", eingabe));
      expect(betrag.toFixed(2)).toBe((Math.round(betrag * 100) / 100).toFixed(2));
      expect(Math.round(betrag * 100)).toBe(Math.round(parseFloat(eingabe) * 100));
    }
    expect(parseFloat(eigenerBetrag("", "1.115")).toFixed(2)).toBe("1.12");
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

describe("Überweisungsdaten: Betrag immer mit zwei Nachkommastellen", () => {
  it("betragMitCent: 12,5 → 12.50, ganze Zahl → 25.00", () => {
    expect(betragMitCent(12.5)).toBe("12.50");
    expect(betragMitCent(25)).toBe("25.00");
  });

  it("nimmt die Summe des Warenkorbs: 12,5 → 12.50 (Kopiertext ging bisher als 12.5 raus)", () => {
    const items = [position({ totalPrice: 12.5 })];
    expect(ueberweisungsbetrag({ donationType: "one-time", amount: "", customAmount: "", items, totalAmount: 12.5 })).toBe("12.50");
  });

  it("nimmt ohne Warenkorb den gewählten oder eigenen Betrag, gerundet auf Cent", () => {
    expect(ueberweisungsbetrag({ donationType: "one-time", amount: "30", customAmount: "", items: [], totalAmount: 0 })).toBe("30.00");
    expect(ueberweisungsbetrag({ donationType: "one-time", amount: "", customAmount: "7.5", items: [], totalAmount: 0 })).toBe("7.50");
    expect(ueberweisungsbetrag({ donationType: "one-time", amount: "", customAmount: "12.346", items: [], totalAmount: 0 })).toBe("12.35");
  });
});

describe("hatNullEuroPosition", () => {
  it("findet die freie Spende ohne Betrag, auch wenn andere Positionen die Summe über 0 heben", () => {
    const leer = position({ id: "general-donation", type: "general-donation", unitPrice: 0, totalPrice: 0 });
    expect(hatNullEuroPosition([position({}), leer])).toBe(true);
  });

  it("meldet nichts, wenn jede Position einen Betrag hat oder der Warenkorb leer ist", () => {
    expect(hatNullEuroPosition([position({}), position({ id: "b", totalPrice: 0.01 })])).toBe(false);
    expect(hatNullEuroPosition([])).toBe(false);
  });

  it("zählt NaN als Position ohne Betrag", () => {
    expect(hatNullEuroPosition([position({ totalPrice: NaN })])).toBe(true);
  });
});

describe("ueberweisungsbetrag: Randfälle", () => {
  it("monatlich zählt der gewählte Betrag, nie der Warenkorb", () => {
    const items = [position({ totalPrice: 12.5 })];
    expect(ueberweisungsbetrag({ donationType: "monthly", amount: "10", customAmount: "", items, totalAmount: 12.5 })).toBe("10.00");
  });

  it("Warenkorb mit Summe 0 fällt auf den eigenen Betrag zurück", () => {
    const items = [position({ unitPrice: 0, totalPrice: 0 })];
    expect(ueberweisungsbetrag({ donationType: "one-time", amount: "", customAmount: "7.5", items, totalAmount: 0 })).toBe("7.50");
  });

  it("zeigt bei nicht lesbarem Betrag 0.00 statt NaN", () => {
    expect(betragMitCent(NaN)).toBe("0.00");
    expect(ueberweisungsbetrag({ donationType: "one-time", amount: "", customAmount: "abc", items: [], totalAmount: 0 })).toBe("0.00");
  });
});
