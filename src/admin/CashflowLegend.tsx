import { AUSGABE_ARTEN, EINNAHME_ARTEN } from "./cashflowArten";
import type { CashflowRow } from "./types";

/**
 * Die Legende nennt nur, was im Fenster wirklich vorkommt.
 *
 * Sie ist Pflicht, sobald mehr als eine Serie im Bild ist — sonst haengt die
 * Zuordnung an der Farbe allein, und wer die Farben nicht unterscheiden kann, sieht
 * nur Balken. Der Hinweis zur Schraffur steht dabei, weil sie die einzige Stelle ist,
 * an der die Form etwas bedeutet.
 */
const CashflowLegend = ({ zeilen }: { zeilen: CashflowRow[] }) => {
  const vorhanden = new Set(zeilen.map((zeile) => zeile.art));
  const gruppen = [
    { titel: "In", arten: EINNAHME_ARTEN.filter((art) => vorhanden.has(art.key)) },
    { titel: "Out", arten: AUSGABE_ARTEN.filter((art) => vorhanden.has(art.key)) },
  ].filter((gruppe) => gruppe.arten.length > 0);

  if (gruppen.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-2 text-sm">
      {gruppen.map((gruppe) => (
        <div key={gruppe.titel} className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{gruppe.titel}</span>
          {gruppe.arten.map((art) => (
            <span key={art.key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[1px]"
                style={{ backgroundColor: art.farbe }}
              />
              {art.label}
              {art.hinweis && <span className="text-xs text-muted-foreground">({art.hinweis})</span>}
            </span>
          ))}
        </div>
      ))}
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <svg width={12} height={12} aria-hidden className="shrink-0">
          <pattern id="legendeGeplant" width={6} height={6} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width={6} height={6} fill="currentColor" fillOpacity={0.16} />
            <line x1={0} y1={0} x2={0} y2={6} stroke="currentColor" strokeWidth={2.5} strokeOpacity={0.85} />
          </pattern>
          <rect width={12} height={12} fill="url(#legendeGeplant)" rx={1} />
        </svg>
        hatched = planned
      </span>
    </div>
  );
};

export default CashflowLegend;
