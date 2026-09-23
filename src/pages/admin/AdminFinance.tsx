import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditableAmount from "@/admin/EditableAmount";
import StatTile from "@/admin/StatTile";
import { useNoIndex } from "@/admin/useNoIndex";
import { formatDate, formatEur } from "@/admin/format";
import {
  useAccountChecks,
  useDuesAccounts,
  useExpectedThisMonth,
  useForecast,
  useMonthBalances,
  usePlannedIncome,
  useUpdatePlannedAmount,
} from "@/admin/financeQueries";
import { cn } from "@/lib/utils";

const monatsformat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

const formatMonth = (value: string | null): string =>
  value ? monatsformat.format(new Date(value)) : "–";

const CERTAINTY_LABELS: Record<string, string> = {
  fix: "fixed",
  wahrscheinlich: "likely",
  moeglich: "possible",
};

const RHYTHM_LABELS: Record<string, string> = {
  einmalig: "one-off",
  monatlich: "monthly",
  quartalsweise: "quarterly",
  jaehrlich: "yearly",
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

  const bilanz = useMonthBalances();
  const konten = useAccountChecks();
  const beitraege = useDuesAccounts();
  const vorschau = useForecast();
  const plan = usePlannedIncome();
  const erwartung = useExpectedThisMonth();
  const betragAendern = useUpdatePlannedAmount();

  const bestand = useMemo(
    () => (konten.data ?? []).reduce((sum, konto) => sum + Number(konto.saldo_gemessen ?? 0), 0),
    [konten.data],
  );

  const beitragssoll = useMemo(
    () => (beitraege.data ?? []).reduce((sum, zeile) => sum + Number(zeile.beitrag_eur), 0),
    [beitraege.data],
  );

  const offenerBedarf = useMemo(
    () => (vorschau.data ?? []).reduce((sum, zeile) => sum + Number(zeile.offen_eur), 0),
    [vorschau.data],
  );

  const imRueckstand = useMemo(
    () => (beitraege.data ?? []).filter((zeile) => Number(zeile.rueckstand) > 0),
    [beitraege.data],
  );

  const offeneDifferenzen = useMemo(
    () => (konten.data ?? []).filter((konto) => Math.abs(Number(konto.startsaldo_implizit ?? 0)) > 0.02),
    [konten.data],
  );

  const laedt = bilanz.isLoading || konten.isLoading || beitraege.isLoading || vorschau.isLoading;

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
        <StatTile label="Balance today" value={formatEur(bestand)} hint="All accounts, as last read" />
        <StatTile
          label="Expected per month"
          value={formatEur(erwartung.data?.erwartet ?? 0)}
          hint={`${formatEur(erwartung.data?.fix ?? 0)} of it fixed`}
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
        titel="Forecast"
        erklaerung="Phases on the same rank are funded together and therefore finish at the same time. Expected counts fixed and likely income, conservative only fixed."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead className="text-right">Open</TableHead>
              <TableHead className="text-right">of it high</TableHead>
              <TableHead className="text-right">Funded from</TableHead>
              <TableHead className="text-right">Conservative</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(vorschau.data ?? []).map((zeile) => (
              <TableRow key={`${zeile.projekt}-${zeile.phase}`}>
                <TableCell className="tabular-nums text-muted-foreground">{zeile.rang}</TableCell>
                <TableCell>{zeile.projekt}</TableCell>
                <TableCell>{zeile.phase}</TableCell>
                <TableCell className="text-right tabular-nums">{formatEur(zeile.offen_eur)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {zeile.offen_high === null ? "–" : formatEur(zeile.offen_high)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatMonth(zeile.finanziert_ab_erwartet)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatMonth(zeile.finanziert_ab_konservativ)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Abschnitt>

      <Abschnitt
        titel="Planned income"
        erklaerung="Everything expected that is not a membership fee. The amount can be edited here; rhythm, period and certainty are maintained in the database."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rhythm</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Certainty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
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
                  <Badge variant={zeile.sicherheit === "fix" ? "default" : "secondary"}>
                    {CERTAINTY_LABELS[zeile.sicherheit] ?? zeile.sicherheit}
                  </Badge>
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
                </TableCell>
              </TableRow>
            ))}
            {(plan.data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No planned income yet.
                </TableCell>
              </TableRow>
            )}
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

      <Abschnitt
        titel="Monthly balance"
        erklaerung="Actuals per month. The balance is anchored to the account balances read off the accounts."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Costs</TableHead>
              <TableHead className="text-right">To Uganda</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(bilanz.data ?? []).slice(0, 12).map((zeile) => (
              <TableRow key={zeile.monat}>
                <TableCell>{formatMonth(zeile.monat)}</TableCell>
                <TableCell className="text-right tabular-nums text-primary">{formatEur(zeile.einnahmen)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatEur(zeile.ausgaben)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatEur(Number(zeile.spendentransfer) + Number(zeile.transfergebuehren))}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatEur(zeile.netto)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatEur(zeile.bestand)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Abschnitt>
    </div>
  );
};

export default AdminFinance;
