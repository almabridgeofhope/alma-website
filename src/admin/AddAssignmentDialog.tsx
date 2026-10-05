import { useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReceiptPicker } from "./useReceiptPicker";
import type { DriveFile } from "@/lib/googleDrive";
import { formatQty, formatUgx, parseAmount } from "./format";
import { unitCostUgx, useCreateAssignment } from "./queries";
import type { ProjectItem } from "./types";

interface AddAssignmentDialogProps {
  transferId: string;
  item: ProjectItem;
  onClose: () => void;
}

const AddAssignmentDialog = ({ transferId, item, onClose }: AddAssignmentDialogProps) => {
  const createAssignment = useCreateAssignment(transferId);
  const [qty, setQty] = useState(String(item.qty_open));
  const [unit, setUnit] = useState(String(Math.round(unitCostUgx(item))));
  const [amount, setAmount] = useState(String(Math.round(item.qty_open * unitCostUgx(item))));
  const [receipt, setReceipt] = useState<DriveFile | null>(null);
  const { pick, isPicking } = useReceiptPicker();

  // Die drei Felder halten sich gegenseitig aktuell. Gespeichert wird nur der
  // Gesamtbetrag — Menge mal Einzelbetrag ergibt ihn, und wer den Gesamtbetrag
  // eintraegt, rechnet den Einzelbetrag zurueck.
  const totalOf = (qtyInput: string, unitInput: string): string => {
    const parsedQty = parseAmount(qtyInput);
    const parsedUnit = parseAmount(unitInput);
    return parsedQty === null || parsedUnit === null ? "" : String(Math.round(parsedQty * parsedUnit));
  };

  const changeQty = (next: string) => {
    setQty(next);
    setAmount(totalOf(next, unit));
  };

  const changeUnit = (next: string) => {
    setUnit(next);
    setAmount(totalOf(qty, next));
  };

  const changeAmount = (next: string) => {
    setAmount(next);
    const parsedQty = parseAmount(qty);
    const parsedTotal = parseAmount(next);
    if (parsedQty === null || parsedQty <= 0 || parsedTotal === null) {
      setUnit("");
      return;
    }
    setUnit(String(Math.round((parsedTotal / parsedQty) * 100) / 100));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedQty = parseAmount(qty);
    if (parsedQty === null || parsedQty <= 0) {
      toast.error("The quantity must be greater than 0.");
      return;
    }

    try {
      await createAssignment.mutateAsync({
        transferId,
        itemId: item.project_item_id,
        qtyPaid: parsedQty,
        amountPaidUgx: parseAmount(amount),
        receiptUrl: receipt?.url ?? null,
      });
      toast.success(`${item.item_name ?? item.project_item_id} assigned.`);
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.item_name ?? item.project_item_id}</DialogTitle>
          <DialogDescription>
            {item.project_item_id} · open {formatQty(item.qty_open)} of {formatQty(item.qty_needed)} ·
            unit price {formatUgx(Math.round(unitCostUgx(item)))}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity paid</Label>
              <Input
                id="qty"
                inputMode="decimal"
                autoFocus
                required
                value={qty}
                onChange={(event) => changeQty(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Actual per unit</Label>
              <Input
                id="unit"
                inputMode="decimal"
                value={unit}
                onChange={(event) => changeUnit(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Actual total in UGX</Label>
              <Input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => changeAmount(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Receipt</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPicking}
                onClick={async () => {
                  const datei = await pick("position");
                  if (datei) setReceipt(datei);
                }}
              >
                {isPicking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {receipt ? "Choose another receipt" : "Receipt from Drive"}
              </Button>
              {receipt && <span className="min-w-0 truncate text-sm">{receipt.name}</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              The receipt from Uganda. The picker can upload it or take it from the receipt folder
              — it can also be added later.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAssignment.isPending}>
              {createAssignment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssignmentDialog;
