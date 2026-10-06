import { useMemo, useState } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CashflowChart from "@/admin/CashflowChart";
import CashflowLegend from "@/admin/CashflowLegend";
import CashflowTable from "@/admin/CashflowTable";
import EditableAmount from "@/admin/EditableAmount";
import StatTile from "@/admin/StatTile";
import { useNoIndex } from "@/admin/useNoIndex";
import { formatDate, formatEur } from "@/admin/format";
import {
  useAccountChecks,
  useDuesAccounts,
  useExpectedThisMonth,
  useForecast,
  usePlannedCosts,
  useAccountCoverage,
  useCashflow,
  usePlannedIncome,
  usePlannedIncomeMonths,
  usePartnershipArrears,
  useUpdateCostAmount,
  useUpdatePlannedAmount,
} from "@/admin/financeQueries";
import type { PlannedIncomeMonth } from "@/admin/types";
import { cn } from "@/lib/utils";

const monatsformat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
const ableseformat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const formatReading = (value: string | null): string => (value ? ableseformat.format(new Date(value)) : "–");

const KONTO_NAMEN: Record<string, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  wise: "Wise",
};

const formatMonth = (value: string | null): string =>
  value ? monatsformat.format(new Date(value)) : "–";

const RHYTHM_LABELS: Record<string, string> = {
  einmalig: "one-off",
  monatlich: "monthly",
  quartalsweise: "quarterly",
  jaehrlich: "yearly",
};

const kurzesDatum = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/**
 * Was eine monatliche Planzeile in diesem Monat gebracht hat und wie stark sie schwankt.
 *
 * Bei einer Kooperation ist der Planbetrag nur ein Richtwert. Die Spanne der letzten
 * sechs Monate zeigt, wie weit der echte Betrag davon abweicht — gezaehlt werden nur
 * Monate, in denen etwas kam.
 */
const planStatusJeZeile = (zeilen: PlannedIncomeMonth[]) => {
  const jetzt = new Date();
  const laufend = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const jePlan = new Map<string, { diesenMonat?: PlannedIncomeMonth; frueher: number[] }>();
  zeilen.forEach((zeile) => {
    const eintrag = jePlan.get(zeile.plan_id) ?? { frueher: [] };
    if (zeile.monat === laufend) eintrag.diesenMonat = zeile;
    else if (zeile.erfuellt) eintrag.frueher.push(Number(zeile.ist));
    jePlan.set(zeile.plan_id, eintrag);
  });
  return jePlan;
};

const Abschnitt = ({
  titel,
  erklaerung,
  children,
}: {
  titel: string;
  erklaerung?: string;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">{titel}</CardTitle>
      {erklaerung && <p className="text-sm text-muted-foreground">{erklaerung}</p>}
    </CardHeader>
    <CardContent className="pt-0">{children}</CardContent>
  </Card>
);

const AdminFinance = () => {
  useNoIndex("Finance · Project accounting");

  const konten = useAccountChecks();
  const beitraege = useDuesAccounts();
  const vorschau = useForecast();
  const plan = usePlannedIncome();
  const planIst = usePlannedIncomeMonths();
  const planStatus = useMemo(() => planStatusJeZeile(planIst.data ?? []), [planIst.data]);
  const rueckstand = usePartnershipArrears();
  const rueckstandJePlan = useMemo(
    () => new Map((rueckstand.data ?? []).map((zeile) => [zeile.plan_id, zeile])),
    [rueckstand.data],
  );
  const erwartung = useExpectedThisMonth();
  const kosten = usePlannedCosts();
  const verlauf = useCashflow();
  const deckung = useAccountCoverage();

  /**
   * Weggeklickte Arten. Steht hier und nicht im Diagramm, weil die Legende sie
   * umschaltet und beide denselben Stand brauchen.
   */
  const [ausgeblendet, setAusgeblendet] = useState<string[]>([]);
  const [tabelleOffen, setTabelleOffen] = useState(false);
  const artUmschalten = (art: string) =>
    setAusgeblendet((bisher) =>
      bisher.includes(art) ? bisher.filter((eintrag) => eintrag !== art) : [...bisher, art],
    );
  const kostenAendern = useUpdateCostAmount();
  const betragAendern = useUpdatePlannedAmount();

  /** Nur Konten mit Geld darauf: das abgeloeste MLP-Konto steht dauerhaft auf null. */
  const kontenMitStand = useMemo(
    () =>
      (konten.data ?? []).filter(
        (konto) => Number(konto.saldo_verfuegbar ?? 0) !== 0 || Number(konto.schwebend ?? 0) !== 0,
      ),
    [konten.data],
  );

  const bestand = useMemo(
    () => kontenMitStand.reduce((sum, konto) => sum + Number(konto.saldo_verfuegbar ?? 0), 0),
    [kontenMitStand],
  );

  /** Der aelteste Stand bestimmt, wie aktuell die Summe ist. */
  const aeltesterStand = useMemo(
    () =>
      kontenMitStand
        .map((konto) => konto.abgelesen_um)
        .filter((zeit): zeit is string => zeit !== null)
        .sort()[0] ?? null,
    [kontenMitStand],
  );

  const beitragssoll = useMemo(
    () => (beitraege.data ?? []).reduce((sum, zeile) => sum + Number(zeile.beitrag_eur), 0),
    [beitraege.data],
  );

  const offenerBedarf = useMemo(
    () => (vorschau.data ?? []).reduce((sum, zeile) => sum + Number(zeile.offen_eur), 0),
    [vorschau.data],
  );

  /**
   * Die Mitgliedsbeitraege als eine Planzeile: Summe der Saetze aller Mitglieder, und
   * ob der Beitrag dieses Monats schon da ist. Einzeln stehen sie unter Membership accounts.
   */
  const mitgliedschaft = useMemo(() => {
    const jetzt = new Date();
    const monatsbeginn = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth(), 1)).toISOString().slice(0, 10);
    const zeilen = (beitraege.data ?? [])
      .map((zeile) => ({ ...zeile, bezahlt: zeile.letzte_zahlung !== null && zeile.letzte_zahlung >= monatsbeginn }))
      .sort((a, b) => Number(b.beitrag_eur) - Number(a.beitrag_eur) || (a.name ?? "").localeCompare(b.name ?? ""));
    return {
      zeilen,
      summe: zeilen.reduce((sum, zeile) => sum + Number(zeile.beitrag_eur), 0),
      bezahlt: zeilen.filter((zeile) => zeile.bezahlt).length,
      seit: zeilen.reduce<string | null>(
        (frueheste, zeile) => (frueheste === null || zeile.mitglied_seit < frueheste ? zeile.mitglied_seit : frueheste),
        null,
      ),
    };
  }, [beitraege.data]);

  const monatseinnahmen = useMemo(
    () =>
      mitgliedschaft.summe +
      (plan.data ?? [])
        .filter((zeile) => zeile.rhythmus === "monatlich")
        .reduce((sum, zeile) => sum + Number(zeile.betrag_eur), 0),
    [plan.data, mitgliedschaft.summe],
  );

  const monatskosten = useMemo(
    () =>
      (kosten.data ?? [])
        .filter((zeile) => zeile.rhythmus === "monatlich")
        .reduce((sum, zeile) => sum + Number(zeile.betrag_eur), 0),
    [kosten.data],
  );

  const imRueckstand = useMemo(
    () => (beitraege.data ?? []).filter((zeile) => Number(zeile.rueckstand) > 0),
    [beitraege.data],
  );

  /** Geklaerte Differenzen (abgeloestes MLP-Konto) gelten nicht als offen. */
  const offeneDifferenzen = useMemo(
    () =>
      (konten.data ?? []).filter(
        (konto) => !konto.differenz_erklaert && Math.abs(Number(konto.startsaldo_implizit ?? 0)) > 0.02,
      ),
    [konten.data],
  );

  /**
   * Die Luecke ist der tiefste Punkt der gerechneten Deckung, sobald sie unter null
   * faellt — so viel muesste bis dahin zusaetzlich hereinkommen, damit alles Geplante
   * bezahlt werden kann.
   */
  const luecke = useMemo(() => {
    const imMinus = (deckung.data ?? []).filter((zeile) => !zeile.gemessen && Number(zeile.bestand) < 0);
    if (imMinus.length === 0) return null;
    const tiefster = imMinus.reduce((tief, zeile) => (Number(zeile.bestand) < Number(tief.bestand) ? zeile : tief));
    return { ab: imMinus[0].monat, tiefster: tiefster.monat, betrag: -Number(tiefster.bestand) };
  }, [deckung.data]);

  const laedt = konten.isLoading || beitraege.isLoading || vorschau.isLoading;

  if (laedt) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance</h1>
        <p className="text-sm text-muted-foreground">
          What came in, what is expected, and when the project phases are funded.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Balance today"
          value={formatEur(bestand)}
          hint={`Available on all accounts, as of ${formatReading(aeltesterStand)}`}
          details={
            <div className="space-y-2 text-sm">
              {kontenMitStand.map((konto) => (
                <div key={konto.konto}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium">{KONTO_NAMEN[konto.konto] ?? konto.konto}</span>
                    <span className="tabular-nums">{formatEur(Number(konto.saldo_verfuegbar))}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    as of {formatReading(konto.abgelesen_um)}
                    {Number(konto.schwebend) > 0 && ` · ${formatEur(Number(konto.schwebend))} pending, not counted`}
                  </p>
                </div>
              ))}
            </div>
          }
        />
        <StatTile
          label="Expected per month"
          value={formatEur(erwartung.data?.gesamt ?? 0)}
          hint={`${formatEur(erwartung.data?.beitraege ?? 0)} of it membership fees`}
          tone="positive"
        />
        <StatTile
          label="Membership dues"
          value={formatEur(beitragssoll)}
          hint={`${beitraege.data?.length ?? 0} members`}
        />
        <StatTile
          label="Open project need"
          value={formatEur(offenerBedarf)}
          hint={`${vorschau.data?.length ?? 0} phases`}
          tone="warning"
        />
      </div>

      {offeneDifferenzen.length > 0 && (
        <Card className="border-secondary">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-secondary-foreground" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-medium">Accounts that do not reconcile</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {offeneDifferenzen.map((konto) => (
                  <li key={konto.konto}>
                    <span className="font-medium text-foreground">{konto.konto}</span>{" "}
                    {formatEur(Number(konto.startsaldo_implizit))} difference between the balance read off the
                    account and the bookings
                    {konto.notiz ? ` — ${konto.notiz}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Abschnitt
        titel="Money in and out"
      >
        {verlauf.isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <>
            <CashflowChart
              zeilen={verlauf.data ?? []}
              deckung={deckung.data ?? []}
              ausgeblendet={ausgeblendet}
            />
            <CashflowLegend
              zeilen={verlauf.data ?? []}
              ausgeblendet={ausgeblendet}
              umschalten={artUmschalten}
            />
            {luecke && (
              <p className="mt-4 flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                <span>
                  From {formatMonth(luecke.ab)} the plans are not covered. At the lowest point in{" "}
                  {formatMonth(luecke.tiefster)} the accounts would be{" "}
                  <span className="font-medium tabular-nums">{formatEur(luecke.betrag)}</span> short.
                </span>
              </p>
            )}
            {/* Die Zahlen stehen im Diagramm; wer sie genau braucht, klappt auf. */}
            <Collapsible open={tabelleOffen} onOpenChange={setTabelleOffen} className="mt-6">
              <CollapsibleTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ChevronRight
                  className={cn("h-4 w-4 transition-transform", tabelleOffen && "rotate-90")}
                  aria-hidden="true"
                />
                {tabelleOffen ? "Hide the figures" : "Show the figures month by month"}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <CashflowTable zeilen={verlauf.data ?? []} deckung={deckung.data ?? []} />
                <p className="mt-3 text-xs text-muted-foreground">
                  Costs before today are a single figure apart from the transfers. Which payment is
                  staff, fee or project is decided when the bookings are assigned to the project
                  items, and that is still outstanding — breaking the past down now would be a
                  guess, not a measurement.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </Abschnitt>

      <Abschnitt
        titel="Planned income"
        erklaerung="Everything expected, membership fees included. For a partnership the amount is a guide value: every payment covers a month, whatever the amount, and a month without payment stays open until it is paid. Membership fees are set per member; the other amounts can be edited here, rhythm and period are maintained in the database."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rhythm</TableHead>
              <TableHead>From</TableHead>
              <TableHead>This month</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <div className="font-medium">Membership fees</div>
                <div className="text-xs text-muted-foreground">
                  {mitgliedschaft.zeilen.length} members, each listed under membership accounts
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">beitrag</TableCell>
              <TableCell className="text-muted-foreground">{RHYTHM_LABELS.monatlich}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(mitgliedschaft.seit)}</TableCell>
              <TableCell>
                <Badge variant={mitgliedschaft.bezahlt === mitgliedschaft.zeilen.length ? "default" : "secondary"}>
                  {mitgliedschaft.bezahlt} of {mitgliedschaft.zeilen.length} paid
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatEur(mitgliedschaft.summe)}</TableCell>
            </TableRow>
            {(plan.data ?? []).map((zeile) => (
              <TableRow key={zeile.plan_id}>
                <TableCell>
                  <div className="font-medium">{zeile.bezeichnung}</div>
                  {zeile.kommentar && (
                    <div className="text-xs text-muted-foreground">{zeile.kommentar}</div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{zeile.kategorie}</TableCell>
                <TableCell className="text-muted-foreground">
                  {RHYTHM_LABELS[zeile.rhythmus] ?? zeile.rhythmus}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(zeile.von_datum)}</TableCell>
                <TableCell>
                  {(() => {
                    // Kooperation: ein ausgebliebener Monat bleibt offen, bis nachgezahlt ist.
                    const offen = rueckstandJePlan.get(zeile.plan_id);
                    if (zeile.kategorie === "kooperation" && offen && Number(offen.offen_monate) > 0) {
                      // Der laufende Monat ist nur noch nicht dran; zurueck liegt, was darueber hinaus fehlt.
                      const diesenMonatOffen = !planStatus.get(zeile.plan_id)?.diesenMonat?.erfuellt;
                      const zurueck = Math.max(Number(offen.offen_monate) - (diesenMonatOffen ? 1 : 0), 0);
                      const teile = [
                        zurueck === 1 ? "1 month behind" : zurueck > 1 ? `${zurueck} months behind` : null,
                        diesenMonatOffen ? (zurueck > 0 ? "this month open" : "This month open") : null,
                      ].filter(Boolean);
                      return (
                        <div>
                          <Badge variant={zurueck > 0 ? "destructive" : "secondary"}>{teile.join(" · ")}</Badge>
                          <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                            {formatEur(offen.offen_eur)}
                            {offen.letzter_eingang &&
                              ` · last ${kurzesDatum.format(new Date(offen.letzter_eingang))}`}
                          </div>
                        </div>
                      );
                    }
                    const monat = planStatus.get(zeile.plan_id)?.diesenMonat;
                    if (!monat) return <span className="text-muted-foreground">–</span>;
                    return monat.erfuellt ? (
                      <div>
                        <Badge variant="default">Received</Badge>
                        <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                          {formatEur(monat.ist)}
                          {monat.erste_zahlung && ` · ${kurzesDatum.format(new Date(monat.erste_zahlung))}`}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="secondary">Open</Badge>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <EditableAmount
                      label={`Amount for ${zeile.bezeichnung}`}
                      value={zeile.betrag_eur}
                      allowEmpty={false}
                      onCommit={(next) => {
                        if (next !== null) betragAendern.mutate({ planId: zeile.plan_id, betrag: next });
                      }}
                    />
                  </div>
                  {zeile.kategorie === "kooperation" && (() => {
                    const frueher = planStatus.get(zeile.plan_id)?.frueher ?? [];
                    return (
                      <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        guide value
                        {frueher.length > 1 &&
                          ` · last 6 mo. ${formatEur(Math.min(...frueher))}–${formatEur(Math.max(...frueher))}`}
                      </div>
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={5} className="font-medium">
                Per month
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatEur(monatseinnahmen)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Abschnitt>

      <Abschnitt
        titel="Planned costs"
        erklaerung="What goes out every month before anything reaches a project. The forecast subtracts this list — not an assumption in the config."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rhythm</TableHead>
              <TableHead>From</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(kosten.data ?? []).map((zeile) => (
              <TableRow key={zeile.plan_id}>
                <TableCell>
                  <div className="font-medium">{zeile.bezeichnung}</div>
                  {zeile.kommentar && <div className="text-xs text-muted-foreground">{zeile.kommentar}</div>}
                </TableCell>
                <TableCell className="text-muted-foreground">{zeile.kategorie}</TableCell>
                <TableCell className="text-muted-foreground">
                  {RHYTHM_LABELS[zeile.rhythmus] ?? zeile.rhythmus}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(zeile.von_datum)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <EditableAmount
                      label={`Amount for ${zeile.bezeichnung}`}
                      value={zeile.betrag_eur}
                      allowEmpty={false}
                      onCommit={(next) => {
                        if (next !== null) kostenAendern.mutate({ planId: zeile.plan_id, betrag: next });
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4} className="font-medium">
                Per month
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatEur(monatskosten)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Abschnitt>

      <Abschnitt
        titel="Membership accounts"
        erklaerung="Dues owed since joining against everything that came in. Anything above is a donation, anything missing is arrears."
      >
        {imRueckstand.length > 0 && (
          <p className="mb-3 text-sm text-muted-foreground">
            {imRueckstand.length === 1 ? "One member is" : `${imRueckstand.length} members are`} behind.
            From six months of arrears §6 (5) of the statutes allows exclusion.
          </p>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="text-right">Per month</TableHead>
              <TableHead>Since</TableHead>
              <TableHead className="text-right">Due</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Last payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(beitraege.data ?? []).map((zeile) => (
              <TableRow key={zeile.contact_id}>
                <TableCell className="font-medium">{zeile.name ?? zeile.contact_id}</TableCell>
                <TableCell className="text-right tabular-nums">{formatEur(zeile.beitrag_eur)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(zeile.mitglied_seit)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{formatEur(zeile.soll)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatEur(zeile.ist)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    Number(zeile.saldo) < 0 ? "text-secondary-foreground" : "text-primary",
                  )}
                >
                  {formatEur(zeile.saldo)}
                  {Number(zeile.rueckstand_monate) > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({zeile.rueckstand_monate} mo.)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{formatDate(zeile.letzte_zahlung)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Abschnitt>

    </div>
  );
};

export default AdminFinance;
