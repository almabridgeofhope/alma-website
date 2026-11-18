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
 * Was ein Eingabefeld enthält. Bestimmt, ob Dezimalstellen erlaubt sind:
 * - "ugx": ganze Schilling, keine Dezimalstellen ("150.50" ist ungültig)
 * - "eur": Euro, höchstens zwei Dezimalstellen
 * - "zahl": Mengen, Einzelpreise, Nummern, höchstens zwei Dezimalstellen
 */
export type Betragsart = "ugx" | "eur" | "zahl";

// Beide Zweige führen beide Felder (das andere als `undefined`), weil das Projekt ohne
// `strictNullChecks` kompiliert und TypeScript sonst nicht nach `ok` einengt.
export type BetragsErgebnis =
  | { ok: true; value: number | null; message?: undefined }
  | { ok: false; message: string; value?: undefined };

const TEIL_ZIFFERN = /^\d+$/;
const DREIER_GRUPPE = /^\d{3}$/;
const ERSTE_GRUPPE = /^[1-9]\d{0,2}$/;

const fehler = (message: string): BetragsErgebnis => ({ ok: false, message });
const wert = (value: number | null): BetragsErgebnis => ({ ok: true, value });

/** Gruppen wie "1,234,567": vorn 1 bis 3 Ziffern ohne führende Null, danach je genau drei. */
const sindTausendergruppen = (teile: string[]): boolean =>
  ERSTE_GRUPPE.test(teile[0]) && teile.slice(1).every((teil) => DREIER_GRUPPE.test(teil));

/** Ein Dezimalteil hat eine oder zwei Ziffern. */
const istDezimalteil = (teil: string): boolean => TEIL_ZIFFERN.test(teil) && teil.length <= 2;

const mitVorzeichen = (vorzeichen: string, zahl: number): number => (vorzeichen === "-" ? -zahl : zahl);

const BEISPIEL = '"1,234.56", "1.234,56" or "150.000"';
const kaputt = (eingabe: string): BetragsErgebnis =>
  fehler(`"${eingabe}" is not a clear amount. Use ${BEISPIEL}; a dot or comma followed by exactly three digits is a thousands separator.`);

const dezimalenVerboten = (eingabe: string): BetragsErgebnis =>
  fehler(`"${eingabe}" has decimals, but UGX amounts are whole numbers. Enter e.g. 150000 or 150.000.`);

/**
 * Liest einen Betrag und sagt bei kaputter oder mehrdeutiger Eingabe, warum nicht.
 * Leer ergibt `value: null`.
 *
 * Regeln:
 * - Punkt oder Komma, gefolgt von genau drei Ziffern und nichts danach, ist ein Tausendertrenner
 *   ("150.000" und "150,000" sind 150000).
 * - Dezimalstellen gibt es nur nach Komma oder Punkt und mit einer oder zwei Ziffern
 *   ("12,5" und "12.50").
 * - Kommen beide Zeichen vor, ist das letzte das Dezimalzeichen ("1,234.56" und "1.234,56").
 * - Alles andere wird abgewiesen, nicht geraten: "1.5.0", "12,34,56", "1234.567", "0.500".
 */
export const pruefeBetrag = (input: string, art: Betragsart = "zahl"): BetragsErgebnis => {
  const eingabe = input.replace(/\s/g, "");
  if (eingabe === "") return wert(null);

  const treffer = /^([-+]?)([\d.,]+)$/.exec(eingabe);
  if (treffer === null || !/\d/.test(treffer[2])) return kaputt(input.trim());
  const [, vorzeichen, zahl] = treffer;

  const ergebnis = leseZiffern(zahl);
  if (ergebnis === null) return kaputt(input.trim());
  if (!Number.isSafeInteger(Math.trunc(ergebnis.zahl))) return kaputt(input.trim());
  if (ergebnis.hatDezimalen && art === "ugx" && !Number.isInteger(ergebnis.zahl)) return dezimalenVerboten(input.trim());
  return wert(mitVorzeichen(vorzeichen, ergebnis.zahl));
};

interface GelesenerBetrag {
  zahl: number;
  hatDezimalen: boolean;
}

/** Nur Ziffern, Punkte und Kommas, ohne Vorzeichen. `null` heißt mehrdeutig oder kaputt. */
const leseZiffern = (zahl: string): GelesenerBetrag | null => {
  const letztesTrennzeichen = Math.max(zahl.lastIndexOf("."), zahl.lastIndexOf(","));
  if (letztesTrennzeichen === -1) return { zahl: Number(zahl), hatDezimalen: false };

  const dezimalzeichen = zahl[letztesTrennzeichen];
  const hinten = zahl.slice(letztesTrennzeichen + 1);
  const vorn = zahl.slice(0, letztesTrennzeichen);
  const vornTeile = vorn.split(/[.,]/);
  const vornZeichen = new Set(vorn.match(/[.,]/g) ?? []);

  // Das letzte Zeichen ist ein Tausendertrenner: drei Ziffern dahinter, davor nur gleiche Trenner.
  const alleTrenner = [...vornTeile, hinten];
  const nurEinTrenner = vornZeichen.size === 0 || (vornZeichen.size === 1 && vornZeichen.has(dezimalzeichen));
  if (DREIER_GRUPPE.test(hinten) && nurEinTrenner) {
    return sindTausendergruppen(alleTrenner) ? { zahl: Number(alleTrenner.join("")), hatDezimalen: false } : null;
  }

  // Sonst Dezimalzeichen: davor nur Tausendergruppen mit dem jeweils anderen Zeichen
  // (oder gar keine), dahinter ein bis zwei Ziffern.
  if (!istDezimalteil(hinten)) return null;
  const andereTrenner = vornZeichen.size === 0 || (vornZeichen.size === 1 && !vornZeichen.has(dezimalzeichen));
  if (!andereTrenner) return null;
  const vornOk = vornZeichen.size === 0 ? vorn === "" || TEIL_ZIFFERN.test(vorn) : sindTausendergruppen(vornTeile);
  if (!vornOk) return null;
  const ganzzahl = vornTeile.join("");
  return { zahl: Number(`${ganzzahl === "" ? "0" : ganzzahl}.${hinten}`), hatDezimalen: true };
};

/**
 * Wie `pruefeBetrag`, aber ohne Fehlertext: leer und ungültig ergeben beide null.
 * Wer eine Meldung braucht (jede Stelle, die speichert), ruft `pruefeBetrag`.
 */
export const parseAmount = (input: string, art: Betragsart = "zahl"): number | null => {
  const ergebnis = pruefeBetrag(input, art);
  return ergebnis.ok ? ergebnis.value : null;
};

/** Beträge werden negativ geführt; für die Anzeige zählt der Betrag. */
export const absolute = (value: number | null | undefined): number => Math.abs(value ?? 0);

/**
 * Zahl als Text für ein vorbelegtes Eingabefeld. Auf zwei Stellen gerundet, damit weder
 * Gleitkomma-Rauschen ("0.30000000000000004") noch drei Stellen ("2.125", läse `pruefeBetrag`
 * als 2125) im Feld stehen.
 */
export const alsEingabe = (zahl: number): string => String(Math.round(zahl * 100) / 100);
