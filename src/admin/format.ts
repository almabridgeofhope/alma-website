const ugxNumber = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const eurNumber = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const qtyNumber = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
const dateNumber = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatUgx = (value: number | null | undefined): string =>
  value === null || value === undefined ? "–" : `${ugxNumber.format(value)} UGX`;

export const formatEur = (value: number | null | undefined): string =>
  value === null || value === undefined ? "–" : eurNumber.format(value);

export const formatQty = (value: number | null | undefined): string =>
  value === null || value === undefined ? "–" : qtyNumber.format(value);

export const formatDate = (value: string | null | undefined): string =>
  value ? dateNumber.format(new Date(value)) : "–";

/** Nimmt deutsche Eingaben an: "1.234,56" wie "1234.56". Leer ergibt null. */
export const parseAmount = (input: string): number | null => {
  const cleaned = input.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (cleaned === "") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Beträge werden negativ geführt; für die Anzeige zählt der Betrag. */
export const absolute = (value: number | null | undefined): number => Math.abs(value ?? 0);
