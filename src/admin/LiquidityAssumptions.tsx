import { formatEur } from "./format";
import type { LiquidityRow } from "./types";

interface Quelle {
  bezeichnung: string;
  kategorie: string;
  sicherheit: string;
  betrag: number;
}

const SICHERHEIT_LABELS: Record<string, string> = {
  fix: "fixed",
  wahrscheinlich: "likely",
  moeglich: "possible",
};

/**
 * Woraus die Kurve entsteht. Ohne diese Aufstellung ist die Timeline eine Behauptung:
 * man sieht eine Linie steigen und weiss nicht, aus welchen Annahmen sie kommt.
 */
const LiquidityAssumptions = ({
  monat,
  startbestand,
  quellen,
  bereitsEingegangen,
}: {
  monat: LiquidityRow | undefined;
  startbestand: number;
  quellen: Quelle[];
  bereitsEingegangen: number;
}) => {
  if (!monat) return null;

  /** Der laufende Monat zaehlt nur den Rest; die volle Erwartung steht in den Quellen. */
  const restDieserMonat = Number(monat.einnahmen_erwartet);
  const einnahmen = quellen.reduce((sum, quelle) => sum + Number(quelle.betrag), 0);
  const kosten = Number(monat.verwaltungskosten);
  const puffer = Number(monat.puffer);
  const proMonat = einnahmen - kosten;

  const sortiert = [...quellen].sort((a, b) => Number(b.betrag) - Number(a.betrag));

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
      <p className="font-medium">How the curve is built</p>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Expected each month</p>
          <ul className="mt-1.5 space-y-1">
            {sortiert.map((quelle) => (
              <li key={quelle.bezeichnung} className="flex items-baseline justify-between gap-4">
                <span className="truncate">
                  {quelle.bezeichnung}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {SICHERHEIT_LABELS[quelle.sicherheit] ?? quelle.sicherheit}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatEur(Number(quelle.betrag))}</span>
              </li>
            ))}
            <li className="flex items-baseline justify-between gap-4 border-t border-border pt-1 font-medium">
              <span>Income</span>
              <span className="tabular-nums">{formatEur(einnahmen)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-4 text-muted-foreground">
              <span>Running costs (assumption)</span>
              <span className="tabular-nums">−{formatEur(kosten)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-4 border-t border-border pt-1 font-medium">
              <span>Grows by</span>
              <span className="tabular-nums">{formatEur(proMonat)} / month</span>
            </li>
            <li className="pt-1 text-xs text-muted-foreground">
              From next month on. This month {formatEur(bereitsEingegangen)} has already arrived and
              sits in the balance, so only {formatEur(restDieserMonat)} is still counted.
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Starting point</p>
          <ul className="mt-1.5 space-y-1">
            <li className="flex items-baseline justify-between gap-4">
              <span>Balance on all accounts</span>
              <span className="tabular-nums">{formatEur(startbestand)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-4 text-muted-foreground">
              <span>Buffer that stays put</span>
              <span className="tabular-nums">−{formatEur(puffer)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-4 border-t border-border pt-1">
              <span>Available today</span>
              <span className="tabular-nums">{formatEur(startbestand - puffer)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-4 text-muted-foreground">
              <span>Still expected this month</span>
              <span className="tabular-nums">+{formatEur(restDieserMonat)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-4 border-t border-border pt-1 font-medium">
              <span>First point of the curve</span>
              <span className="tabular-nums">{formatEur(startbestand - puffer + restDieserMonat)}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            The curve starts at that figure and rises by the monthly growth. The conservative line
            counts only the fixed part — membership dues — and leaves out everything that varies.
            Running costs come from the list below — not from a hidden assumption. What was
            actually spent is in v_verwaltungskosten.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiquidityAssumptions;
