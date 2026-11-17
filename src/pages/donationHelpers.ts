// Reine Helfer des Spendenformulars (src/pages/Donation.tsx), als eigenes Modul, damit sie ohne
// React testbar sind (donationHelpers.test.ts).

import type { CartItem } from "@/contexts/cartReducer";
import { aufCent, summeInCent } from "@/contexts/cartReducer";

export const formatBankTransferReference = (intentId: string) => `ALMA-${intentId}`;

type DonationDonorFormFields = {
  donorType: "private" | "company";
  firstName: string;
  lastName: string;
  companyName: string;
};

export const getDonationDonorDisplayName = (fd: DonationDonorFormFields): string => {
  if (fd.donorType === "company") {
    return fd.companyName.trim();
  }
  return `${fd.firstName.trim()} ${fd.lastName.trim()}`.trim();
};

/** Parse form-submit / Edge Function error JSON without stringifying nested objects as [object Object]. */
export const formatFormSubmitErrorDetail = (body: unknown): string => {
  if (body == null || typeof body !== "object") {
    return typeof body === "string" ? body : "";
  }
  const b = body as Record<string, unknown>;
  if (typeof b.error === "string") {
    return b.error;
  }
  if (b.error != null && typeof b.error === "object") {
    return JSON.stringify(b.error);
  }
  if (typeof b.message === "string") {
    return b.message;
  }
  if (typeof b.code === "string" || typeof b.code === "number") {
    return String(b.code);
  }
  return JSON.stringify(body);
};

/**
 * Eigener oder gewählter Betrag (Eingabe bzw. ?amount=) auf ganze Cent gerundet, wie der
 * Warenkorb (aufCent): "12.346" → "12.35". Leer bleibt leer, Unlesbares bleibt unverändert, damit
 * die Prüfungen der Aufrufer (isNaN, ≤ 0) weiter greifen.
 */
export const eigenerBetrag = (amount: string, customAmount: string): string => {
  const eingabe = amount || customAmount;
  const betrag = parseFloat(eingabe);
  return eingabe === "" || isNaN(betrag) ? eingabe : String(aufCent(betrag));
};

interface SpendenBetragEingaben {
  donationType: string;
  amount: string;
  customAmount: string;
  items: CartItem[];
  totalAmount: number;
}

/** Betrag der Spende in EUR: monatlich aus der Auswahl, einmalig bevorzugt aus dem Warenkorb. */
export const endbetragDerSpende = ({ donationType, amount, customAmount, items, totalAmount }: SpendenBetragEingaben): number => {
  if (donationType === "monthly") {
    return parseFloat(eigenerBetrag(amount, customAmount) || "0");
  }

  if (items.length > 0) {
    const cartTotal = totalAmount;
    if (!isNaN(cartTotal) && cartTotal > 0) {
      return cartTotal;
    }

    const calculatedTotal = summeInCent(
      items.map((item) => {
        const itemTotal = item.totalPrice || (item.unitPrice * (item.quantity || 1));
        return isNaN(itemTotal) ? 0 : itemTotal;
      }),
    );
    if (!isNaN(calculatedTotal) && calculatedTotal > 0) {
      return calculatedTotal;
    }
  }

  return parseFloat(eigenerBetrag(amount, customAmount) || "0");
};

/** Trennt die Hausnummer vom Ende der Straßenangabe: "Hauptstraße 12a" → "Hauptstraße" + "12a". */
export const strasseUndHausnummer = (eingabe: string): { street: string; houseNumber: string } => {
  const rawStreet = eingabe.trim();
  const streetMatch = rawStreet.match(/^(.*?)(?:\s+|,)(\d+[a-zA-Z0-9\-/]*)$/);
  const parsedStreet = streetMatch?.[1]?.trim() || rawStreet;
  const parsedHouseNumber = streetMatch?.[2]?.trim() || "";
  return { street: parsedStreet, houseNumber: parsedHouseNumber };
};
