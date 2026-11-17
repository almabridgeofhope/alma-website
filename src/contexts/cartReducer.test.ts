import { describe, expect, it } from "vitest";
import { CartAction, CartItem, CartState, cartReducer, initialState } from "./cartReducer";

// Warenkorb der Spendenseite: Summen in EUR, Anzahl = Zahl der Positionen (nicht der Stücke).

type NeuePosition = Omit<CartItem, "quantity" | "totalPrice">;

const ziegel: NeuePosition = {
  id: "item-bricks",
  type: "item",
  name: "Ziegel",
  description: "",
  unitPrice: 12.5,
  category: "",
  maxQuantity: 3,
};

const sack: NeuePosition = {
  id: "item-cement",
  type: "item",
  name: "Zement",
  description: "",
  unitPrice: 8,
  category: "",
};

const spende: NeuePosition = {
  id: "general-donation",
  type: "general-donation",
  name: "Allgemeine Spende",
  description: "Alt",
  unitPrice: 50,
  category: "donation",
  isEditable: true,
};

const nach = (...actions: CartAction[]): CartState => actions.reduce(cartReducer, initialState);

describe("cartReducer – ADD_ITEM", () => {
  it("legt eine neue Position mit Menge 1 und Stückpreis als Summe an", () => {
    const state = nach({ type: "ADD_ITEM", payload: ziegel });
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ id: "item-bricks", quantity: 1, totalPrice: 12.5 });
    expect(state.totalItems).toBe(1);
    expect(state.totalAmount).toBe(12.5);
  });

  it("erhöht bei derselben ID die Menge statt eine zweite Position anzulegen", () => {
    const state = nach({ type: "ADD_ITEM", payload: ziegel }, { type: "ADD_ITEM", payload: ziegel });
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ quantity: 2, totalPrice: 25 });
    expect(state.totalItems).toBe(1);
    expect(state.totalAmount).toBe(25);
  });

  it("zählt Positionen, nicht Stücke, und summiert über alle Positionen", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: ziegel },
      { type: "ADD_ITEM", payload: ziegel },
      { type: "ADD_ITEM", payload: sack },
    );
    expect(state.totalItems).toBe(2);
    expect(state.totalAmount).toBe(33);
  });

  it("summiert Cent-Beträge ungerundet – Befund, offen (TESTING.md, Schicht 2)", () => {
    // 10,10 + 20,20 ergibt im Gleitkomma nicht 30,30. Der Reducer rundet nicht; festgehalten ist
    // das heutige Verhalten, kein Sollwert. Stripe (Math.round auf Cent) und PayPal (toFixed(2))
    // runden selbst, form-submit und die Erfolgs-URL bekommen den Wert so wie hier.
    const state = nach(
      { type: "ADD_ITEM", payload: { ...spende, unitPrice: 10.1 } },
      { type: "ADD_ITEM", payload: { ...sack, unitPrice: 20.2 } },
    );
    expect(state.totalAmount).toBe(30.299999999999997);
    expect(state.totalAmount).not.toBe(30.3);
    expect(state.totalAmount).toBeCloseTo(30.3, 2);
  });

  it("deckelt die Menge nicht bei maxQuantity – das macht erst der Provider (updateQuantity)", () => {
    const state = nach(...Array.from({ length: 4 }, (): CartAction => ({ type: "ADD_ITEM", payload: ziegel })));
    expect(state.items[0].quantity).toBe(4);
    expect(state.totalAmount).toBe(50);
  });
});

describe("cartReducer – REMOVE_ITEM", () => {
  it("entfernt die Position und rechnet die Summe neu", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: ziegel },
      { type: "ADD_ITEM", payload: sack },
      { type: "REMOVE_ITEM", payload: "item-bricks" },
    );
    expect(state.items.map((item) => item.id)).toEqual(["item-cement"]);
    expect(state.totalItems).toBe(1);
    expect(state.totalAmount).toBe(8);
  });

  it("lässt den Warenkorb bei unbekannter ID unverändert", () => {
    const vorher = nach({ type: "ADD_ITEM", payload: ziegel });
    const state = cartReducer(vorher, { type: "REMOVE_ITEM", payload: "gibt-es-nicht" });
    expect(state.items).toEqual(vorher.items);
    expect(state.totalAmount).toBe(12.5);
  });
});

describe("cartReducer – UPDATE_QUANTITY", () => {
  it("setzt die Menge und rechnet Positions- und Gesamtsumme neu", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: ziegel },
      { type: "ADD_ITEM", payload: sack },
      { type: "UPDATE_QUANTITY", payload: { id: "item-bricks", quantity: 3 } },
    );
    expect(state.items[0]).toMatchObject({ quantity: 3, totalPrice: 37.5 });
    expect(state.items[1]).toMatchObject({ quantity: 1, totalPrice: 8 });
    expect(state.totalItems).toBe(2);
    expect(state.totalAmount).toBe(45.5);
  });

  it("entfernt die Position bei Menge 0", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: ziegel },
      { type: "UPDATE_QUANTITY", payload: { id: "item-bricks", quantity: 0 } },
    );
    expect(state.items).toEqual([]);
    expect(state.totalItems).toBe(0);
    expect(state.totalAmount).toBe(0);
  });

  it("entfernt die Position bei negativer Menge statt einen negativen Betrag zu bilden", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: ziegel },
      { type: "ADD_ITEM", payload: sack },
      { type: "UPDATE_QUANTITY", payload: { id: "item-cement", quantity: -2 } },
    );
    expect(state.items.map((item) => item.id)).toEqual(["item-bricks"]);
    expect(state.totalAmount).toBe(12.5);
  });

  it("lässt den Warenkorb bei unbekannter ID unverändert", () => {
    const vorher = nach({ type: "ADD_ITEM", payload: ziegel });
    const state = cartReducer(vorher, { type: "UPDATE_QUANTITY", payload: { id: "gibt-es-nicht", quantity: 5 } });
    expect(state.items).toEqual(vorher.items);
    expect(state.totalItems).toBe(1);
    expect(state.totalAmount).toBe(12.5);
  });

  it("behält bei Menge 1 die Position", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: ziegel },
      { type: "ADD_ITEM", payload: ziegel },
      { type: "UPDATE_QUANTITY", payload: { id: "item-bricks", quantity: 1 } },
    );
    expect(state.items[0]).toMatchObject({ quantity: 1, totalPrice: 12.5 });
    expect(state.totalAmount).toBe(12.5);
  });
});

describe("cartReducer – UPDATE_AMOUNT (freie Spende)", () => {
  it("setzt Betrag als Stückpreis und Summe und benennt die alte „Allgemeine Spende“ um", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: spende },
      { type: "ADD_ITEM", payload: sack },
      { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 75 } },
    );
    expect(state.items[0]).toMatchObject({
      unitPrice: 75,
      totalPrice: 75,
      quantity: 1,
      name: "Wirkungsorientierte Spende",
      description: "Wirkungsorientierte Spende für unsere Projekte",
    });
    expect(state.totalItems).toBe(2);
    expect(state.totalAmount).toBe(83);
  });

  it("entfernt die Spende bei negativem Betrag statt einen negativen Betrag zu bilden", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: spende },
      { type: "ADD_ITEM", payload: sack },
      { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: -5 } },
    );
    expect(state.items.map((item) => item.id)).toEqual(["item-cement"]);
    expect(state.totalItems).toBe(1);
    expect(state.totalAmount).toBe(8);
  });

  it("lässt einen anderen Namen der Spende stehen", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: { ...spende, name: "Unrestricted donation", description: "EN" } },
      { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 20 } },
    );
    expect(state.items[0]).toMatchObject({ name: "Unrestricted donation", description: "EN", totalPrice: 20 });
  });

  it("benennt eine Sachposition namens „Allgemeine Spende“ nicht um", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: { ...sack, name: "Allgemeine Spende", description: "Sache" } },
      { type: "UPDATE_AMOUNT", payload: { id: "item-cement", amount: 30 } },
    );
    expect(state.items[0]).toMatchObject({ name: "Allgemeine Spende", description: "Sache", totalPrice: 30 });
  });

  it("entfernt die Spende bei Betrag 0", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: spende },
      { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 0 } },
    );
    expect(state.items).toEqual([]);
    expect(state.totalItems).toBe(0);
    expect(state.totalAmount).toBe(0);
  });
});

describe("cartReducer – LOAD_CART, CLEAR_CART, Öffnen", () => {
  it("übernimmt gespeicherte Positionen und rechnet die Summen aus deren totalPrice", () => {
    // Die Positionen kommen aus localStorage. totalPrice wird ungeprüft übernommen, nicht aus
    // Menge × Stückpreis neu gerechnet – ein veränderter Speicher ändert also die Summe.
    const gespeichert: CartItem[] = [
      { ...ziegel, quantity: 2, totalPrice: 25 },
      { ...sack, quantity: 3, totalPrice: 24 },
    ];
    const state = cartReducer(initialState, { type: "LOAD_CART", payload: gespeichert });
    expect(state.items).toEqual(gespeichert);
    expect(state.totalItems).toBe(2);
    expect(state.totalAmount).toBe(49);
  });

  it("leert den Warenkorb, lässt ihn aber offen", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: ziegel },
      { type: "TOGGLE_CART" },
      { type: "CLEAR_CART" },
    );
    expect(state).toEqual({ items: [], isOpen: true, totalItems: 0, totalAmount: 0 });
  });

  it("schaltet mit TOGGLE_CART um und schließt mit CLOSE_CART", () => {
    expect(nach({ type: "TOGGLE_CART" }).isOpen).toBe(true);
    expect(nach({ type: "TOGGLE_CART" }, { type: "TOGGLE_CART" }).isOpen).toBe(false);
    expect(nach({ type: "TOGGLE_CART" }, { type: "CLOSE_CART" }).isOpen).toBe(false);
    expect(nach({ type: "CLOSE_CART" }).isOpen).toBe(false);
  });

  it("verändert den bisherigen Zustand nicht", () => {
    const vorher = nach({ type: "ADD_ITEM", payload: ziegel });
    const kopie = structuredClone(vorher);
    cartReducer(vorher, { type: "ADD_ITEM", payload: ziegel });
    cartReducer(vorher, { type: "UPDATE_QUANTITY", payload: { id: "item-bricks", quantity: 3 } });
    cartReducer(vorher, { type: "UPDATE_AMOUNT", payload: { id: "item-bricks", amount: 99 } });
    cartReducer(vorher, { type: "REMOVE_ITEM", payload: "item-bricks" });
    expect(vorher).toEqual(kopie);
  });
});
