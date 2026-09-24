import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEur } from "./format";
import type { ForecastRow, LiquidityRow } from "./types";

const monatKurz = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" });
const monatLang = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const achsenBetrag = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 });

interface Punkt {
  monat: string;
  label: string;
  langerLabel: string;
  erwartet: number;
  konservativ: number;
}

/** Eine Stufe der Rangfolge als waagerechte Marke: hier kreuzt der Bedarf die Kurve. */
interface Schwelle {
  rang: number;
  betrag: number;
  titel: string;
}

const Hinweis = ({ active, payload }: { active?: boolean; payload?: { payload: Punkt }[] }) => {
  if (!active || !payload?.length) return null;
  const punkt = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-card">
      <p className="font-medium">{punkt.langerLabel}</p>
      <p className="mt-1 tabular-nums">
        <span className="text-muted-foreground">Expected </span>
        {formatEur(punkt.erwartet)}
      </p>
      <p className="tabular-nums">
        <span className="text-muted-foreground">Conservative </span>
        {formatEur(punkt.konservativ)}
      </p>
    </div>
  );
};

/**
 * Wie viel Geld ueber dem Puffer wann zur Verfuegung steht, und wo die Rangstufen
 * der Projektplanung liegen. Eine Achse, zwei Szenarien, die Schwellen als Marken —
 * der Schnittpunkt ist die Antwort auf "ab wann koennen wir das bezahlen".
 */
const LiquidityTimeline = ({
  liquiditaet,
  vorschau,
}: {
  liquiditaet: LiquidityRow[];
  vorschau: ForecastRow[];
}) => {
  const punkte = useMemo<Punkt[]>(
    () =>
      liquiditaet.map((zeile) => {
        const datum = new Date(zeile.monat);
        return {
          monat: zeile.monat,
          label: monatKurz.format(datum),
          langerLabel: monatLang.format(datum),
          erwartet: Number(zeile.frei_erwartet),
          konservativ: Number(zeile.frei_konservativ),
        };
      }),
    [liquiditaet],
  );

  const schwellen = useMemo<Schwelle[]>(() => {
    const jeRang = new Map<number, number>();
    vorschau.forEach((zeile) => {
      jeRang.set(zeile.rang, Number(zeile.kosten_kumuliert));
    });
    return Array.from(jeRang, ([rang, betrag]) => ({
      rang,
      betrag,
      titel: `Rank ${rang} · ${formatEur(betrag)}`,
    })).sort((a, b) => a.betrag - b.betrag);
  }, [vorschau]);

  const hoechsteSchwelle = schwellen.length ? schwellen[schwellen.length - 1].betrag : 0;
  const obergrenze = Math.max(hoechsteSchwelle * 1.1, ...punkte.map((p) => p.erwartet));

  if (punkte.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={punkte} margin={{ top: 8, right: 96, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="verlaufErwartet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.6} vertical={false} />

        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <YAxis
          width={56}
          tickLine={false}
          axisLine={false}
          domain={[0, Math.ceil(obergrenze / 1000) * 1000]}
          tickFormatter={(wert: number) => `€${achsenBetrag.format(wert)}`}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />

        <Tooltip content={<Hinweis />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />

        {schwellen.map((schwelle) => (
          <ReferenceLine
            key={schwelle.rang}
            y={schwelle.betrag}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            strokeOpacity={0.7}
            label={{
              value: schwelle.titel,
              position: "right",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
            }}
          />
        ))}

        <Area
          type="monotone"
          dataKey="erwartet"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#verlaufErwartet)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
          name="Expected"
        />
        <Line
          type="monotone"
          dataKey="konservativ"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          name="Conservative"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default LiquidityTimeline;
