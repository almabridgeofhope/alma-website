import { describe, expect, it } from "vitest";
import { CartAction, CartItem, CartState, aufCent, cartReducer, initialState, summeInCent } from "./cartReducer";

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

  it("summiert Cent-Beträge in ganzen Cent: 10,10 + 20,20 = 30,30", () => {
    // Im Gleitkomma ergäbe die Summe 30.299999999999997. Der Wert geht so an form-submit, in die
    // Erfolgs-URL und in die kopierten Überweisungsdaten; Stripe und PayPal runden zusätzlich selbst.
    const state = nach(
      { type: "ADD_ITEM", payload: { ...spende, unitPrice: 10.1 } },
      { type: "ADD_ITEM", payload: { ...sack, unitPrice: 20.2 } },
    );
    expect(state.totalAmount).toBe(30.3);
    expect(String(state.totalAmount)).toBe("30.3");
  });

  it("rundet die Positionssumme beim Hochzählen: 3 × 0,10 = 0,30", () => {
    const groschen = { ...sack, id: "item-nails", unitPrice: 0.1 };
    const state = nach(...Array.from({ length: 3 }, (): CartAction => ({ type: "ADD_ITEM", payload: groschen })));
    expect(state.items[0]).toMatchObject({ quantity: 3, totalPrice: 0.3 });
    expect(state.totalAmount).toBe(0.3);
  });

  it("rundet einen Stückpreis mit Rest unter einem Cent, etwa eine summierte Phase", () => {
    // Phasen kommen mit unitPrice = Budget der Phase in den Warenkorb, das Budget ist eine Summe
    // (ProjectItemsModal.tsx) und kann im Gleitkomma krumm sein.
    const phase: NeuePosition = { ...sack, id: "phase-roof", type: "phase", unitPrice: 1234.5600000000002 };
    const state = nach({ type: "ADD_ITEM", payload: phase });
    expect(state.items[0]).toMatchObject({ unitPrice: 1234.56, totalPrice: 1234.56 });
    expect(state.totalAmount).toBe(1234.56);
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

  it("rundet Menge × Stückpreis auf Cent: 3 × 0,07 = 0,21 und 3 × 33,33 = 99,99", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: { ...sack, unitPrice: 0.07 } },
      { type: "ADD_ITEM", payload: { ...ziegel, unitPrice: 33.33 } },
      { type: "UPDATE_QUANTITY", payload: { id: "item-cement", quantity: 3 } },
      { type: "UPDATE_QUANTITY", payload: { id: "item-bricks", quantity: 3 } },
    );
    expect(state.items.map((item) => item.totalPrice)).toEqual([0.21, 99.99]);
    expect(state.totalAmount).toBe(100.2);
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

  it("rundet einen frei eingegebenen Betrag auf Cent: 12,344 → 12,34 und 12,346 → 12,35", () => {
    const abgerundet = nach(
      { type: "ADD_ITEM", payload: spende },
      { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 12.344 } },
    );
    expect(abgerundet.items[0]).toMatchObject({ unitPrice: 12.34, totalPrice: 12.34 });
    expect(abgerundet.totalAmount).toBe(12.34);

    const aufgerundet = cartReducer(abgerundet, { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 12.346 } });
    expect(aufgerundet.totalAmount).toBe(12.35);
  });

  it("entfernt die Spende, wenn der Betrag auf 0 Cent rundet (0,004)", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: spende },
      { type: "ADD_ITEM", payload: sack },
      { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 0.004 } },
    );
    expect(state.items.map((item) => item.id)).toEqual(["item-cement"]);
    expect(state.totalAmount).toBe(8);
  });

  it("behält einen Betrag, der auf 1 Cent rundet (0,005)", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: spende },
      { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 0.005 } },
    );
    expect(state.items[0]).toMatchObject({ totalPrice: 0.01 });
    expect(state.totalAmount).toBe(0.01);
  });

  it("liefert bei demselben Betrag auf Cent denselben Zustand zurück, kein neues items-Array", () => {
    // Donation.tsx setzt die Spende aus ?amount= in einem Effekt, der auf cartState.items hört.
    // Ein neues Array bei unverändertem Betrag (12,345 → 12,35 → 12,35 …) ließe ihn ohne Ende laufen.
    const vorher = nach(
      { type: "ADD_ITEM", payload: sack },
      { type: "ADD_ITEM", payload: { ...spende, name: "Wirkungsorientierte Spende" } },
      { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 12.345 } },
    );
    expect(vorher.items[1].totalPrice).toBe(12.35);
    expect(cartReducer(vorher, { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 12.345 } })).toBe(vorher);
    expect(cartReducer(vorher, { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 12.35 } })).toBe(vorher);
    expect(cartReducer(vorher, { type: "UPDATE_AMOUNT", payload: { id: "gibt-es-nicht", amount: 5 } })).toBe(vorher);
  });

  it("benennt die alte „Allgemeine Spende“ auch bei gleichem Betrag um", () => {
    const state = nach({ type: "ADD_ITEM", payload: spende }, { type: "UPDATE_AMOUNT", payload: { id: "general-donation", amount: 50 } });
    expect(state.items[0]).toMatchObject({ name: "Wirkungsorientierte Spende", totalPrice: 50 });
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

  it("rundet krumme Beträge aus einem älteren gespeicherten Warenkorb auf Cent", () => {
    // Vor der Cent-Rundung landeten Summen wie 0.30000000000000004 in localStorage.
    const gespeichert: CartItem[] = [
      { ...sack, unitPrice: 0.1, quantity: 3, totalPrice: 0.30000000000000004 },
      { ...spende, unitPrice: 50.004999, quantity: 1, totalPrice: 10.1 },
      { ...ziegel, unitPrice: 20.2, quantity: 1, totalPrice: 20.2 },
    ];
    const state = cartReducer(initialState, { type: "LOAD_CART", payload: gespeichert });
    expect(state.items.map((item) => item.totalPrice)).toEqual([0.3, 10.1, 20.2]);
    expect(state.items.map((item) => item.unitPrice)).toEqual([0.1, 50, 20.2]);
    expect(state.totalAmount).toBe(30.6);
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

describe("aufCent und summeInCent", () => {
  it("rundet auf ganze Cent, auch negative Beträge und 0", () => {
    expect(aufCent(0)).toBe(0);
    expect(aufCent(19.999)).toBe(20);
    expect(aufCent(0.30000000000000004)).toBe(0.3);
    expect(aufCent(1.15)).toBe(1.15);
    expect(aufCent(-1.234)).toBe(-1.23);
  });

  it("rundet wie stripeService (Math.round auf Cent), damit dort derselbe Betrag ankommt", () => {
    // stripeService.ts schickt Math.round(amount * 100) Cent. Für einen schon gerundeten Betrag
    // ändert das nichts mehr; auch 1,005 (im Gleitkomma knapp darunter) bleibt bei beiden 1,00.
    for (const eur of [10.1, 30.299999999999997, 1.005, 12.344, 12.346, 99.99]) {
      expect(Math.round(aufCent(eur) * 100)).toBe(Math.round(eur * 100));
    }
    expect(aufCent(1.005)).toBe(1);
  });

  it("summiert in ganzen Cent: zehnmal 0,10 = 1,00, nicht 0.9999999999999999", () => {
    expect(summeInCent(Array.from({ length: 10 }, () => 0.1))).toBe(1);
    expect(summeInCent([10.1, 20.2])).toBe(30.3);
    expect(summeInCent([])).toBe(0);
  });

  it("liefert für PayPal (toFixed(2)) und die Erfolgs-URL (toString) denselben Betrag", () => {
    const state = nach(
      { type: "ADD_ITEM", payload: { ...spende, unitPrice: 10.1 } },
      { type: "ADD_ITEM", payload: { ...sack, unitPrice: 20.2 } },
    );
    expect(state.totalAmount.toFixed(2)).toBe("30.30");
    expect(new URLSearchParams({ amount: state.totalAmount.toString() }).toString()).toBe("amount=30.3");
  });
});
