import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatUgx } from "./format";
import type { useBelegVorschlag } from "./useBelegVorschlag";

interface BelegVorschlagFelderProps {
  beleg: ReturnType<typeof useBelegVorschlag>;
  /** Eingetragener Gesamtbetrag in UGX, gegen den der Beleg geprüft wird. */
  betragUgx: number | null;
  /** So wird die Datei beim Speichern heißen; null, wenn sie ihren Namen behält. */
  neuerName: string | null;
}

const GELESEN = "border-primary bg-primary/5";

const Gelesen = () => <span className="ml-1.5 text-xs font-medium text-primary">from receipt</span>;

const Hinweis = ({ art, children }: { art: "ok" | "warn" | "info"; children: React.ReactNode }) => (
  <div
    role="status"
    className={cn(
      "flex items-start gap-2 rounded-md px-3 py-2 text-sm",
      art === "ok" && "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
      art === "warn" && "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
      art === "info" && "bg-muted text-muted-foreground",
    )}
  >
    {children}
  </div>
);

/** Status, die zwei gelesenen Felder und der künftige Dateiname — unter dem Beleg-Knopf. */
const BelegVorschlagFelder = ({ beleg, betragUgx, neuerName }: BelegVorschlagFelderProps) => {
  if (beleg.status === "idle") return null;

  if (beleg.status === "reading") {
    return (
      <Hinweis art="info">
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
        Reading receipt …
      </Hinweis>
    );
  }

  const v = beleg.vorschlag;
  const inUgx = v?.amount != null && (v.currency === null || v.currency === "UGX");
  const weichtAb = inUgx && betragUgx !== null && v!.amount !== betragUgx;

  return (
    <div className="space-y-3">
      {beleg.status === "failed" && (
        <Hinweis art="info">The receipt could not be read automatically. Enter the number if you like.</Hinweis>
      )}
      {v?.several_receipts && (
        <Hinweis art="warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          This looks like a summary of several receipts. Enter the number only if one receipt belongs here.
        </Hinweis>
      )}
      {v && !v.several_receipts && !v.receipt_no && (
        <Hinweis art="warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          No receipt number found. Enter it if the receipt has one — otherwise the file is named by item and date.
        </Hinweis>
      )}
      {weichtAb && (
        <Hinweis art="warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Amount differs: receipt {formatUgx(v!.amount)}, entered {formatUgx(betragUgx)}. Please check before assigning.
        </Hinweis>
      )}
      {v && inUgx && !weichtAb && v.receipt_no && !v.several_receipts && (
        <Hinweis art="ok">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Receipt matches: {formatUgx(v.amount)}
          {v.purpose ? ` · ${v.purpose}` : ""}
        </Hinweis>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="receipt-no">
            Receipt No.{beleg.nummerGelesen && <Gelesen />}
          </Label>
          <Input
            id="receipt-no"
            className={cn(beleg.nummerGelesen && GELESEN)}
            value={beleg.nummer}
            onChange={(event) => beleg.nummerAendern(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receipt-date">
            Receipt date{beleg.datumGelesen && <Gelesen />}
          </Label>
          <Input
            id="receipt-date"
            type="date"
            className={cn(beleg.datumGelesen && GELESEN)}
            value={beleg.datum}
            onChange={(event) => beleg.datumAendern(event.target.value)}
          />
        </div>
      </div>

      {neuerName && (
        <p className="text-xs text-muted-foreground">
          Saved in Drive as <span className="break-all font-mono text-foreground">{neuerName}</span>
        </p>
      )}
    </div>
  );
};

export default BelegVorschlagFelder;
