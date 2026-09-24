/**
 * Die Arten des Finanzverlaufs: Reihenfolge, Farbe, Beschriftung.
 *
 * Eine Quelle fuer Diagramm und Tabelle, damit beide dieselbe Farbe fuer dieselbe
 * Sache zeigen. Die Reihenfolge ist zugleich die Stapelreihenfolge — das Stabilste
 * liegt an der Nulllinie, das Schwankende aussen, sonst wackelt bei jedem Monat der
 * ganze Balken.
 *
 * Die Farben sind die CVD-sichere Auswahl nach Okabe-Ito. Gegen die helle
 * Diagrammflaeche geprueft: Helligkeitsband, Chroma, Trennung benachbarter Paare bei
 * Deuteranopie und Tritanopie, Normalsicht-Abstand. Drei Toene liegen unter 3:1
 * Kontrast zur Flaeche — deshalb steht unter dem Diagramm die Tabelle mit denselben
 * Farben als Marker, und keine Aussage haengt allein an der Farbe.
 *
 * Zwei Ausnahmen mit Absicht: `laufende_kosten` und `durchlaufend` sind entsaettigt
 * und fallen damit durch die Chroma-Pruefung. Das Grau ist die Aussage — die einen
 * sind noch nicht aufgeschluesselt, die anderen sind kein Geld, das dem Zweck zur
 * Verfuegung steht. Gegen ihre Nachbarn im Stapel trennen beide sauber (ΔE 15,3 bzw.
 * 21,5 bei Normalsicht).
 *
 * Fuer einen dunklen Modus braucht es eigene Stufen (Band L 0.48–0.67 statt
 * 0.43–0.77); die Oberflaeche hat heute keinen, deshalb steht hier nur der helle Satz.
 */

export interface Art {
  key: string;
  label: string;
  farbe: string;
  /** Erklaerung fuer die Legende, wo der Name allein nicht reicht. */
  hinweis?: string;
}

export const EINNAHME_ARTEN: Art[] = [
  { key: "beitrag", label: "Membership dues", farbe: "#0072B2" },
  { key: "dauerspende", label: "Recurring donations", farbe: "#009E73", hinweis: "Corporate partnerships" },
  { key: "einmalspende", label: "One-off donations", farbe: "#56B4E9" },
  {
    key: "durchlaufend",
    label: "Pass-through",
    farbe: "#66707E",
    hinweis: "Covers an expense",
  },
];

export const AUSGABE_ARTEN: Art[] = [
  { key: "personal", label: "Staff Uganda", farbe: "#D55E00" },
  { key: "gebuehren", label: "Payment and bank fees", farbe: "#E69F00" },
  { key: "verwaltung", label: "Software and services", farbe: "#CC79A7" },
  { key: "werkzeug", label: "Tools", farbe: "#8B5A3C" },
  {
    key: "laufende_kosten",
    label: "Running costs",
    farbe: "#7A7267",
    hinweis: "Not yet broken down",
  },
  {
    key: "projekttransfer",
    label: "Transfers to Uganda",
    farbe: "#8C3557",
    hinweis: "Largest item — can be hidden",
  },
];

/** Die Kontodeckung ist keine Kategorie, sondern die Linie darueber. */
export const BESTAND_FARBE = "#2B2B28";

const ALLE = [...EINNAHME_ARTEN, ...AUSGABE_ARTEN];

export const findeArt = (key: string): Art =>
  ALLE.find((art) => art.key === key) ?? { key, label: key, farbe: "#9CA3AF" };

/** Der Schluessel einer Serie im Diagramm: Richtung, Art und ob gemessen. */
export const serienKey = (richtung: string, art: string, gemessen: boolean): string =>
  `${richtung}:${art}:${gemessen ? "ist" : "plan"}`;
