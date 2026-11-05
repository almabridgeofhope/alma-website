/**
 * Dateinamen nach dem Schema der Belegordner in Drive.
 *
 * Quittung zu einer Position: R<Quittungsnummer>_<Positionen>, z. B. R234_WE-WEL-001.jpeg.
 * Ohne lesbare Nummer: <Positionen>_<YYMMDD>, damit die Datei trotzdem auffindbar ist.
 */

/** Schon nach Schema benannt (R234_…, ID13_R231_…) — dann bleibt der Name, wie er ist. */
export const istSchemaName = (name: string): boolean => /^(R\d[0-9A-Za-z-]*|ID\d+)_/.test(name);

const ENDUNG_NACH_TYP: Record<string, string> = {
  "image/jpeg": ".jpeg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "application/pdf": ".pdf",
};

export const endungVon = (name: string, mimeType?: string): string =>
  name.match(/\.[A-Za-z0-9]{2,5}$/)?.[0].toLowerCase() ?? ENDUNG_NACH_TYP[mimeType ?? ""] ?? "";

/** Nur Zeichen, die in einem Dateinamen sicher sind; "No. 0234 " wird zu "0234". */
export const nummerFuerName = (nummer: string): string =>
  nummer.trim().replace(/^(no\.?|nr\.?|#)\s*/i, "").replace(/[^0-9A-Za-z-]/g, "");

/** "2026-03-23" → "260323"; alles andere ergibt einen leeren Text. */
export const kurzdatum = (iso: string | null | undefined): string =>
  iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(2).replace(/-/g, "") : "";

interface PositionsBeleg {
  nummer: string;
  positionen: string[];
  datum: string | null | undefined;
  endung: string;
}

export const positionsBelegName = ({ nummer, positionen, datum, endung }: PositionsBeleg): string => {
  const teile = positionen.join("_");
  const sauber = nummerFuerName(nummer);
  if (sauber !== "") return `R${sauber}_${teile}${endung}`;
  const tag = kurzdatum(datum);
  return `${teile}${tag ? `_${tag}` : ""}${endung}`;
};

interface GeplanterName {
  datei: { name: string; mimeType?: string };
  nummer: string;
  positionen: string[];
  datum: string | null | undefined;
}

/** Neuer Name für einen gewählten Beleg — oder null, wenn er schon nach Schema heißt. */
export const geplanterName = ({ datei, nummer, positionen, datum }: GeplanterName): string | null =>
  istSchemaName(datei.name)
    ? null
    : positionsBelegName({ nummer, positionen, datum, endung: endungVon(datei.name, datei.mimeType) });

/** "2026-03-14" → "20260314" — Überweisungsbelege tragen das volle Datum. */
export const langdatum = (iso: string | null | undefined): string =>
  iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.replace(/-/g, "") : "";

interface UeberweisungsBeleg {
  buchungNr: number | null;
  nummer: string;
  datum: string | null | undefined;
  endung: string;
}

/**
 * Empfangsquittung aus Uganda zu einer Überweisung: ID<Buchung>_R<Nr>_<YYYYMMDD>,
 * z. B. ID21_R233_20260314.jpeg. Fehlt ein Teil, fällt nur dieser Teil weg.
 */
export const ueberweisungsBelegName = ({ buchungNr, nummer, datum, endung }: UeberweisungsBeleg): string => {
  const sauber = nummerFuerName(nummer);
  const teile = [
    buchungNr !== null ? `ID${buchungNr}` : "",
    sauber !== "" ? `R${sauber}` : "",
    langdatum(datum),
  ].filter((teil) => teil !== "");
  return `${teile.join("_")}${endung}`;
};

/** Wie geplanterName, für den Beleg einer Überweisung. */
export const geplanterUeberweisungsName = ({
  datei,
  buchungNr,
  nummer,
  datum,
}: Omit<GeplanterName, "positionen"> & { buchungNr: number | null }): string | null =>
  istSchemaName(datei.name)
    ? null
    : ueberweisungsBelegName({ buchungNr, nummer, datum, endung: endungVon(datei.name, datei.mimeType) });
