import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EditableAmount from "./EditableAmount";
import { absolute, formatQty } from "./format";
import { useUpdateTransfer } from "./queries";
import type { Transfer } from "./types";

interface TransferBuchungProps {
  transfer: Transfer;
  transferId: string;
}

/** Buchungsnummer, angekommener Betrag und Zweck — direkt bearbeitbar. */
const TransferBuchung = ({ transfer, transferId }: TransferBuchungProps) => {
  const updateTransfer = useUpdateTransfer(transferId);
  const [zweck, setZweck] = useState(transfer.zweck ?? "");

  const eur = absolute(transfer.amount);

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
    <Card className="shadow-card">
      <CardContent className="grid gap-4 py-4 sm:grid-cols-[8rem,14rem,1fr]">
        <div className="space-y-1.5">
          <Label>Entry no.</Label>
          <EditableAmount
            label="Entry number"
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
            value={transfer.original_amount === null ? null : absolute(transfer.original_amount)}
            onCommit={(next) =>
              // Der Kurs folgt dem Betrag, sonst stehen beide Zahlen im Widerspruch.
              speichern(
                next === null
                  ? { original_amount: null, original_currency: null, exchange_rate: null }
                  : {
                      original_amount: -Math.abs(next),
                      original_currency: "ugx",
                      exchange_rate: eur > 0 ? Number((next / eur).toFixed(6)) : null,
                    },
                "Amount received",
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            Rate {transfer.exchange_rate ? formatQty(Math.round(transfer.exchange_rate)) : "–"}
          </p>
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
