import { AUSGABE_ARTEN, BESTAND_FARBE, EINNAHME_ARTEN } from "./cashflowArten";
import { cn } from "@/lib/utils";
import type { CashflowRow } from "./types";

/**
 * Die Legende nennt nur, was im Fenster wirklich vorkommt — und schaltet es ab.
 *
 * Sie ist Pflicht, sobald mehr als eine Serie im Bild ist, sonst haengt die Zuordnung
 * an der Farbe allein. Dass sie zugleich der Filter ist, loest hier ein echtes
 * Problem: die Transfers nach Uganda sind zehnmal so gross wie alles andere und
 * druecken die uebrigen Balken auf Strichbreite. Wer sie wegklickt, sieht den Rest.
 */
const CashflowLegend = ({
  zeilen,
  ausgeblendet,
  umschalten,
}: {
  zeilen: CashflowRow[];
  ausgeblendet: string[];
  umschalten: (art: string) => void;
}) => {
  const vorhanden = new Set(zeilen.map((zeile) => zeile.art));
  const gruppen = [
    { titel: "In", arten: EINNAHME_ARTEN.filter((art) => vorhanden.has(art.key)) },
    { titel: "Out", arten: AUSGABE_ARTEN.filter((art) => vorhanden.has(art.key)) },
  ].filter((gruppe) => gruppe.arten.length > 0);

  if (gruppen.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-2 text-sm">
      {gruppen.map((gruppe) => (
        <div key={gruppe.titel} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{gruppe.titel}</span>
          {gruppe.arten.map((art) => {
            const aus = ausgeblendet.includes(art.key);
            return (
              <button
                key={art.key}
                type="button"
                onClick={() => umschalten(art.key)}
                aria-pressed={!aus}
                title={aus ? `Show ${art.label}` : `Hide ${art.label}`}
                className={cn(
                  "flex items-center gap-1.5 rounded px-1 py-0.5 transition-opacity hover:bg-muted",
                  aus && "opacity-45",
                )}
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-[1px]"
                  style={{
                    backgroundColor: aus ? "transparent" : art.farbe,
                    boxShadow: `inset 0 0 0 1.5px ${art.farbe}`,
                  }}
                />
                <span className={cn(aus && "line-through")}>{art.label}</span>
                {art.hinweis && <span className="text-xs text-muted-foreground">({art.hinweis})</span>}
              </button>
            );
          })}
        </div>
      ))}

      <span className="flex items-center gap-1.5 text-muted-foreground">
        <svg width={16} height={10} aria-hidden className="shrink-0">
          <line x1={0} y1={5} x2={16} y2={5} stroke={BESTAND_FARBE} strokeWidth={2} />
        </svg>
        balance on all accounts
      </span>

      <span className="flex items-center gap-1.5 text-muted-foreground">
        <svg width={12} height={12} aria-hidden className="shrink-0">
          <pattern id="legendeGeplant" width={6} height={6} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width={6} height={6} fill="currentColor" fillOpacity={0.16} />
            <line x1={0} y1={0} x2={0} y2={6} stroke="currentColor" strokeWidth={2.5} strokeOpacity={0.85} />
          </pattern>
          <rect width={12} height={12} fill="url(#legendeGeplant)" rx={1} />
        </svg>
        hatched and dashed = planned
      </span>
    </div>
  );
};

export default CashflowLegend;
