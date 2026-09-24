import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEur } from "./format";
import { AUSGABE_ARTEN, BESTAND_FARBE, EINNAHME_ARTEN, findeArt, serienKey } from "./cashflowArten";
import type { CashflowRow, CoverageRow } from "./types";

const monatKurz = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
const monatLang = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const achsenBetrag = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 });

/** Ein Monat als Diagrammpunkt: je Serie ein Feld, Ausgaben negativ. */
interface Punkt {
  monat: string;
  label: string;
  langerLabel: string;
  [serie: string]: string | number;
}

interface Serie {
  key: string;
  richtung: "ein" | "aus";
  art: string;
  gemessen: boolean;
}

const TooltipInhalt = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; payload: Punkt }[];
}) => {
  if (!active || !payload?.length) return null;
  const punkt = payload[0].payload;

  const bestand = payload.find((eintrag) =>
    String(eintrag.dataKey).startsWith("bestand"),
  )?.value;

  const zeilen = payload
    .filter((eintrag) => Number(eintrag.value) !== 0 && !String(eintrag.dataKey).startsWith("bestand"))
    .map((eintrag) => {
      const [richtung, art, stand] = String(eintrag.dataKey).split(":");
      return {
        richtung,
        art: findeArt(art),
        geplant: stand === "plan",
        betrag: Math.abs(Number(eintrag.value)),
      };
    });

  const summe = (richtung: string) =>
    zeilen.filter((z) => z.richtung === richtung).reduce((s, z) => s + z.betrag, 0);
  const netto = summe("ein") - summe("aus");

  return (
    <div className="min-w-56 rounded-md border border-border bg-card px-3 py-2 text-sm shadow-card">
      <p className="font-medium">{punkt.langerLabel}</p>
      <ul className="mt-1.5 space-y-0.5">
        {zeilen.map((zeile) => (
          <li key={`${zeile.richtung}${zeile.art.key}${zeile.geplant}`} className="flex items-baseline gap-2">
            <span
              className="mt-1 inline-block h-2 w-2 shrink-0 rounded-[1px]"
              style={{
                backgroundColor: zeile.art.farbe,
                opacity: zeile.geplant ? 0.45 : 1,
              }}
            />
            <span className="flex-1 truncate">
              {zeile.art.label}
              {zeile.geplant && <span className="ml-1 text-xs text-muted-foreground">planned</span>}
            </span>
            <span className="shrink-0 tabular-nums">
              {zeile.richtung === "aus" ? "−" : "+"}
              {formatEur(zeile.betrag).replace("€", "€ ")}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 flex items-baseline justify-between gap-4 border-t border-border pt-1 font-medium">
        <span>Net</span>
        <span className="tabular-nums">{formatEur(netto)}</span>
      </p>
      {bestand !== undefined && (
        <p className="flex items-baseline justify-between gap-4 text-muted-foreground">
          <span>Balance on all accounts</span>
          <span className="tabular-nums">{formatEur(Number(bestand))}</span>
        </p>
      )}
    </div>
  );
};

/**
 * Eingaenge nach oben, Ausgaenge nach unten, eine Achse, eine durchgehende Zeit.
 *
 * Der Abstand zur Nulllinie ist unmittelbar der Ueberschuss des Monats — dafuer
 * braucht es keine zweite Skala und keine Rechnung im Kopf. Links der Linie steht,
 * was geflossen ist, rechts davon, was die Planung rechnet; das Geplante ist
 * schraffiert, damit der Unterschied auch ohne Farbe erkennbar bleibt.
 *
 * Nicht enthalten: die Transfers nach Uganda (sie folgen den Projekten, nicht dem
 * Monat) und die durchlaufenden Posten (sie gleichen eine Ausgabe aus und stehen
 * sonst auf beiden Seiten).
 */
const CashflowChart = ({
  zeilen,
  deckung,
  monateZurueck = 12,
  monateVoraus = 6,
  ausgeblendet = [],
}: {
  zeilen: CashflowRow[];
  deckung: CoverageRow[];
  monateZurueck?: number;
  monateVoraus?: number;
  /** Arten, die der Betrachter weggeklickt hat — sie verzerren sonst den Massstab. */
  ausgeblendet?: string[];
}) => {
  const { punkte, serien, jetztLabel } = useMemo(() => {
    const jetzt = new Date();
    const monatsErster = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth(), 1));
    const von = new Date(monatsErster);
    von.setUTCMonth(von.getUTCMonth() - monateZurueck);
    const bis = new Date(monatsErster);
    bis.setUTCMonth(bis.getUTCMonth() + monateVoraus);

    const imFenster = zeilen.filter((zeile) => {
      const datum = new Date(zeile.monat);
      return datum >= von && datum <= bis && !ausgeblendet.includes(zeile.art);
    });

    const jeMonat = new Map<string, Punkt>();
    const gesehen = new Map<string, Serie>();

    imFenster.forEach((zeile) => {
      const datum = new Date(zeile.monat);
      if (!jeMonat.has(zeile.monat)) {
        jeMonat.set(zeile.monat, {
          monat: zeile.monat,
          label: monatKurz.format(datum),
          langerLabel: monatLang.format(datum),
        });
      }
      const key = serienKey(zeile.richtung, zeile.art, zeile.gemessen);
      gesehen.set(key, { key, richtung: zeile.richtung, art: zeile.art, gemessen: zeile.gemessen });
      const punkt = jeMonat.get(zeile.monat)!;
      const betrag = Number(zeile.betrag);
      punkt[key] = (Number(punkt[key]) || 0) + (zeile.richtung === "aus" ? -betrag : betrag);
    });

    // Die Deckung als zwei Serien: durchgezogen, solange gemessen, dann gestrichelt.
    // Am Uebergang traegt der laufende Monat beide Werte, sonst reisst die Linie.
    const letzterGemessene = deckung.filter((d) => d.gemessen).at(-1)?.monat;
    deckung.forEach((eintrag) => {
      const punkt = jeMonat.get(eintrag.monat);
      if (!punkt) return;
      const wert = Number(eintrag.bestand);
      if (eintrag.gemessen) punkt.bestandIst = wert;
      if (!eintrag.gemessen || eintrag.monat === letzterGemessene) punkt.bestandPlan = wert;
    });

    // Stapelreihenfolge: das Stabilste an der Nulllinie, gemessen vor geplant.
    const reihenfolge = [
      ...EINNAHME_ARTEN.map((art) => ({ richtung: "ein" as const, art: art.key })),
      ...AUSGABE_ARTEN.map((art) => ({ richtung: "aus" as const, art: art.key })),
    ];
    const sortiert: Serie[] = [];
    reihenfolge.forEach(({ richtung, art }) => {
      [true, false].forEach((gemessen) => {
        const serie = gesehen.get(serienKey(richtung, art, gemessen));
        if (serie) sortiert.push(serie);
      });
    });

    return {
      punkte: Array.from(jeMonat.values()).sort((a, b) => a.monat.localeCompare(b.monat)),
      serien: sortiert,
      jetztLabel: monatKurz.format(monatsErster),
    };
  }, [zeilen, deckung, monateZurueck, monateVoraus, ausgeblendet]);

  if (punkte.length === 0) return null;

  const geplanteArten = Array.from(new Set(serien.filter((s) => !s.gemessen).map((s) => s.art)));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={punkte} stackOffset="sign" margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          {geplanteArten.map((art) => {
            const farbe = findeArt(art).farbe;
            return (
              <pattern
                key={art}
                id={`geplant-${art}`}
                width={6}
                height={6}
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
              >
                <rect width={6} height={6} fill={farbe} fillOpacity={0.16} />
                <line x1={0} y1={0} x2={0} y2={6} stroke={farbe} strokeWidth={2.5} strokeOpacity={0.85} />
              </pattern>
            );
          })}
        </defs>

        <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.6} vertical={false} />

        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        {/* Eng an den tatsaechlichen Werten statt auf runde Schritte aufgerundet:
            sonst verschenkt die Flaeche ein Drittel ihrer Hoehe an leeren Raum, und
            wer eine Kategorie wegklickt, sieht die Skala nicht mitgehen. */}
        <YAxis
          width={60}
          tickLine={false}
          axisLine={false}
          domain={[
            (unten: number) => Math.floor(Math.min(unten, 0) * 1.02),
            (oben: number) => Math.ceil(Math.max(oben, 0) * 1.02),
          ]}
          tickFormatter={(wert: number) => `€${achsenBetrag.format(wert)}`}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />

        <Tooltip
          content={<TooltipInhalt />}
          cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.35 }}
        />

        {/* Die Nulllinie traegt die Aussage — sie ist kraeftiger als das Gitter. */}
        <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.45} />
        <ReferenceLine
          x={jetztLabel}
          stroke="hsl(var(--foreground))"
          strokeOpacity={0.35}
          strokeDasharray="3 3"
          label={{
            value: "today",
            position: "insideTopRight",
            fill: "hsl(var(--muted-foreground))",
            fontSize: 11,
          }}
        />

        {serien.map((serie) => (
          <Bar
            key={serie.key}
            dataKey={serie.key}
            stackId="cashflow"
            fill={serie.gemessen ? findeArt(serie.art).farbe : `url(#geplant-${serie.art})`}
            // Ein duenner Rand in Flaechenfarbe setzt die Segmente voneinander ab.
            stroke="hsl(var(--card))"
            strokeWidth={1}
            isAnimationActive={false}
            maxBarSize={38}
          />
        ))}

        {/* Die Deckung liegt auf derselben Achse wie die Balken. Eine zweite Skala
            waere bequemer und falsch: mit ihr laesst sich jede Aussage erzeugen. */}
        <Line
          type="monotone"
          dataKey="bestandIst"
          stroke={BESTAND_FARBE}
          strokeWidth={2}
          dot={false}
          connectNulls
          isAnimationActive={false}
          name="Balance"
        />
        <Line
          type="monotone"
          dataKey="bestandPlan"
          stroke={BESTAND_FARBE}
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          connectNulls
          isAnimationActive={false}
          name="Balance, projected"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default CashflowChart;
