import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EditableAmount from "./EditableAmount";
import { absolute, formatQty, formatUgx } from "./format";
import { useUpdateTransfer } from "./queries";
import type { Transfer } from "./types";
import { cn } from "@/lib/utils";

interface TransferBuchungProps {
  transfer: Transfer;
  transferId: string;
  className?: string;
}

/** Buchungsnummer, bestaetigter angekommener Betrag und Zweck — direkt bearbeitbar. */
const TransferBuchung = ({ transfer, transferId, className }: TransferBuchungProps) => {
  const updateTransfer = useUpdateTransfer(transferId);
  const [zweck, setZweck] = useState(transfer.zweck ?? "");

  // Ohne Bestaetigung ist ein UGX-Betrag nur der Vorschlag des Wise-Syncs.
  const bestaetigt = transfer.erhalten_bestaetigt_am !== null && transfer.original_amount !== null;
  const vorschlag = !bestaetigt && transfer.original_amount !== null ? absolute(transfer.original_amount) : null;

  const speichern = async (patch: Parameters<typeof updateTransfer.mutateAsync>[0]["patch"], label: string) => {
    try {
      await updateTransfer.mutateAsync({ transactionId: transfer.transaction_id, patch });
      toast.success(`${label} saved.`);
    } catch (error) {
      const message = (error as Error).message.includes("transactions_buchung_nr_uniq")
        ? "That entry number is already taken."
        : (error as Error).message;
      toast.error(message);
    }
  };

  return (
    <Card className={cn("shadow-card", className)}>
      <CardContent className="grid gap-4 py-4 sm:grid-cols-[auto,auto,minmax(0,1fr)]">
        <div className="space-y-1.5">
          <Label>Entry no.</Label>
          <EditableAmount
            label="Entry number"
            className="w-20"
            value={transfer.buchung_nr}
            onCommit={(next) =>
              speichern({ buchung_nr: next === null ? null : Math.round(next) }, "Entry number")
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Received in UGX</Label>
          <EditableAmount
            label="Amount received in UGX"
            className="w-36"
            value={bestaetigt ? absolute(transfer.original_amount) : null}
            onCommit={(next) =>
              // Eintragen ist Bestaetigen; den Kurs rechnet die Datenbank daraus.
              speichern(
                next === null
                  ? { original_amount: null, original_currency: null, erhalten_bestaetigt_am: null }
                  : {
                      original_amount: -Math.abs(next),
                      original_currency: "ugx",
                      erhalten_bestaetigt_am: transfer.erhalten_bestaetigt_am ?? new Date().toISOString(),
                    },
                "Amount received",
              )
            }
          />
          {bestaetigt ? (
            <p className="text-xs text-muted-foreground">
              Rate {transfer.exchange_rate ? formatQty(Math.round(transfer.exchange_rate)) : "–"}
            </p>
          ) : vorschlag !== null ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() =>
                speichern({ erhalten_bestaetigt_am: new Date().toISOString() }, "Amount received")
              }
            >
              Wise says {formatUgx(vorschlag)} · confirm
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Not confirmed yet</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zweck">Purpose</Label>
          <Input
            id="zweck"
            className="h-9"
            value={zweck}
            onChange={(event) => setZweck(event.target.value)}
            onBlur={() => {
              const next = zweck.trim() === "" ? null : zweck.trim();
              if (next !== transfer.zweck) speichern({ zweck: next }, "Purpose");
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TransferBuchung;
