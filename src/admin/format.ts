const ugxNumber = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const eurNumber = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" });
const qtyNumber = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });
const dateNumber = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatUgx = (value: number | null | undefined): string =>
  value === null || value === undefined ? "–" : `${ugxNumber.format(value)} UGX`;

export const formatEur = (value: number | null | undefined): string =>
  value === null || value === undefined ? "–" : eurNumber.format(value);

export const formatQty = (value: number | null | undefined): string =>
  value === null || value === undefined ? "–" : qtyNumber.format(value);

export const formatDate = (value: string | null | undefined): string =>
  value ? dateNumber.format(new Date(value)) : "–";

/**
 * Nimmt englische Eingaben an: "1,234.56" wie "1234.56". Leer ergibt null.
 *
 * Die Oberflaeche ist englisch, also ist das Komma der Tausendertrenner und der
 * Punkt das Dezimalzeichen — deutsche Eingabe wie "1.234,56" wuerde falsch gelesen.
 */
export const parseAmount = (input: string): number | null => {
  const cleaned = input.replace(/\s/g, "").replace(/,/g, "");
  if (cleaned === "") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Beträge werden negativ geführt; für die Anzeige zählt der Betrag. */
export const absolute = (value: number | null | undefined): number => Math.abs(value ?? 0);
