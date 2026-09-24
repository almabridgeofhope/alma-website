import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatEur } from "./format";
import { AUSGABE_ARTEN, EINNAHME_ARTEN } from "./cashflowArten";
import type { CashflowRow, CoverageRow } from "./types";

const monatLang = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

interface Zeile {
  monat: string;
  /** Deckung auf allen Konten zum Monatsende, aus v_kontodeckung. */
  bestand?: number;
  label: string;
  geplant: boolean;
  jeArt: Record<string, number>;
  einnahmen: number;
  ausgaben: number;
  netto: number;
}

const Marker = ({ farbe }: { farbe: string }) => (
  <span
    className="mr-1.5 inline-block h-2 w-2 shrink-0 rounded-[1px] align-middle"
    style={{ backgroundColor: farbe }}
  />
);

/**
 * Dieselben Zahlen wie im Diagramm, nur ablesbar.
 *
 * Aus einem Balken liest niemand einen Betrag ab; das Diagramm zeigt den Verlauf,
 * die Tabelle die Zahl. Gleiche Farben als Marker in den Kopfzeilen, gleiche
 * Reihenfolge — sonst muss man beim Blick nach unten neu zuordnen. Monate, die
 * ueberwiegend gerechnet sind, stehen gedaempft.
 */
const CashflowTable = ({
  zeilen,
  deckung,
  monateZurueck = 12,
  monateVoraus = 6,
}: {
  zeilen: CashflowRow[];
  deckung: CoverageRow[];
  monateZurueck?: number;
  monateVoraus?: number;
}) => {
  const { tabelle, spalten, summen } = useMemo(() => {
    const jetzt = new Date();
    const monatsErster = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth(), 1));
    const von = new Date(monatsErster);
    von.setUTCMonth(von.getUTCMonth() - monateZurueck);
    const bis = new Date(monatsErster);
    bis.setUTCMonth(bis.getUTCMonth() + monateVoraus);

    const imFenster = zeilen.filter((zeile) => {
      const datum = new Date(zeile.monat);
      return datum >= von && datum <= bis;
    });

    const vorhanden = new Set(imFenster.map((zeile) => zeile.art));
    // Der Schluessel traegt die Richtung mit: `durchlaufend` gibt es auf beiden Seiten,
    // und die duerfen sich nicht zu einer Zahl addieren.
    const vorhandenJeRichtung = new Set(imFenster.map((zeile) => `${zeile.richtung}:${zeile.art}`));
    const spaltenListe = [
      ...EINNAHME_ARTEN.filter((art) => vorhandenJeRichtung.has(`ein:${art.key}`)).map((art) => ({
        ...art,
        richtung: "ein" as const,
        spalte: `ein:${art.key}`,
      })),
      ...AUSGABE_ARTEN.filter((art) => vorhandenJeRichtung.has(`aus:${art.key}`)).map((art) => ({
        ...art,
        richtung: "aus" as const,
        spalte: `aus:${art.key}`,
      })),
    ];

    const jeMonat = new Map<string, Zeile>();
    imFenster.forEach((zeile) => {
      if (!jeMonat.has(zeile.monat)) {
        jeMonat.set(zeile.monat, {
          monat: zeile.monat,
          label: monatLang.format(new Date(zeile.monat)),
          geplant: false,
          jeArt: {},
          einnahmen: 0,
          ausgaben: 0,
          netto: 0,
        });
      }
      const eintrag = jeMonat.get(zeile.monat)!;
      const betrag = Number(zeile.betrag);
      const schluessel = `${zeile.richtung}:${zeile.art}`;
      eintrag.jeArt[schluessel] = (eintrag.jeArt[schluessel] ?? 0) + betrag;
      if (zeile.richtung === "ein") eintrag.einnahmen += betrag;
      else eintrag.ausgaben += betrag;
      if (!zeile.gemessen) eintrag.geplant = true;
    });

    const bestandJeMonat = new Map(deckung.map((eintrag) => [eintrag.monat, Number(eintrag.bestand)]));

    const fertig = Array.from(jeMonat.values())
      .map((eintrag) => ({
        ...eintrag,
        netto: eintrag.einnahmen - eintrag.ausgaben,
        bestand: bestandJeMonat.get(eintrag.monat),
      }))
      .sort((a, b) => b.monat.localeCompare(a.monat));

    // Zwei Summen statt einer: Gemessenes und Gerechnetes in einer Zahl zu addieren
    // waere eine Zahl, die nichts bedeutet.
    const summiere = (auswahl: Zeile[]) => {
      const acc = { jeArt: {} as Record<string, number>, einnahmen: 0, ausgaben: 0 };
      auswahl.forEach((eintrag) => {
        spaltenListe.forEach((spalte) => {
          acc.jeArt[spalte.spalte] = (acc.jeArt[spalte.spalte] ?? 0) + (eintrag.jeArt[spalte.spalte] ?? 0);
        });
        acc.einnahmen += eintrag.einnahmen;
        acc.ausgaben += eintrag.ausgaben;
      });
      return { ...acc, netto: acc.einnahmen - acc.ausgaben };
    };

    return {
      tabelle: fertig,
      spalten: spaltenListe,
      summen: [
        { titel: "Total actual", werte: summiere(fertig.filter((z) => !z.geplant)) },
        { titel: "Total planned", werte: summiere(fertig.filter((z) => z.geplant)) },
      ].filter((zeile) => zeile.werte.einnahmen !== 0 || zeile.werte.ausgaben !== 0),
    };
  }, [zeilen, deckung, monateZurueck, monateVoraus]);

  if (tabelle.length === 0) return null;

  const betrag = (wert: number | undefined) =>
    wert === undefined || wert === 0 ? <span className="text-muted-foreground">–</span> : formatEur(wert);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card">Month</TableHead>
            {spalten.map((spalte) => (
              <TableHead key={spalte.spalte} className="whitespace-nowrap text-right">
                <Marker farbe={spalte.farbe} />
                {spalte.label}
              </TableHead>
            ))}
            <TableHead className="text-right">Net</TableHead>
            <TableHead className="whitespace-nowrap text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tabelle.map((zeile) => (
            <TableRow key={zeile.monat} className={cn(zeile.geplant && "text-muted-foreground")}>
              <TableCell className="sticky left-0 whitespace-nowrap bg-card font-medium">
                {zeile.label}
                {zeile.geplant && <span className="ml-1.5 text-xs font-normal">planned</span>}
              </TableCell>
              {spalten.map((spalte) => (
                <TableCell key={spalte.spalte} className="text-right tabular-nums">
                  {spalte.richtung === "aus" && zeile.jeArt[spalte.spalte] ? "−" : ""}
                  {betrag(zeile.jeArt[spalte.spalte])}
                </TableCell>
              ))}
              <TableCell
                className={cn(
                  "text-right font-medium tabular-nums",
                  zeile.netto < 0 && "text-destructive",
                )}
              >
                {formatEur(zeile.netto)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {zeile.bestand === undefined ? (
                  <span className="text-muted-foreground">–</span>
                ) : (
                  formatEur(zeile.bestand)
                )}
              </TableCell>
            </TableRow>
          ))}
          {summen.map((zeile, index) => (
            <TableRow key={zeile.titel} className={cn("font-medium", index === 0 && "border-t-2")}>
              <TableCell className="sticky left-0 whitespace-nowrap bg-card">{zeile.titel}</TableCell>
              {spalten.map((spalte) => (
                <TableCell key={spalte.spalte} className="text-right tabular-nums">
                  {spalte.richtung === "aus" && zeile.werte.jeArt[spalte.spalte] ? "−" : ""}
                  {betrag(zeile.werte.jeArt[spalte.spalte])}
                </TableCell>
              ))}
              <TableCell
                className={cn("text-right tabular-nums", zeile.werte.netto < 0 && "text-destructive")}
              >
                {formatEur(zeile.werte.netto)}
              </TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CashflowTable;
