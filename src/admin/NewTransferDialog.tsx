import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTransfer } from "./queries";
import { formatQty, parseAmount } from "./format";

const KONTEN = ["MLP", "wise"];

const today = (): string => new Date().toISOString().slice(0, 10);

interface NewTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewTransferDialog = ({ open, onOpenChange }: NewTransferDialogProps) => {
  const createTransfer = useCreateTransfer();
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(today);
  const [konto, setKonto] = useState(KONTEN[0]);
  const [amountEur, setAmountEur] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amountUgx, setAmountUgx] = useState("");

  const eur = parseAmount(amountEur);
  const ugx = parseAmount(amountUgx);
  const rate = eur && ugx && eur > 0 ? ugx / eur : null;

  const reset = () => {
    setReference("");
    setDate(today());
    setKonto(KONTEN[0]);
    setAmountEur("");
    setPurpose("");
    setAmountUgx("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (eur === null || eur <= 0) {
      toast.error("Please enter an amount in euros.");
      return;
    }

    try {
      await createTransfer.mutateAsync({
        external_transaction_id: reference.trim(),
        date,
        konto,
        amount: eur,
        reference: purpose.trim() === "" ? null : purpose.trim(),
        original_amount: ugx,
        exchange_rate: rate === null ? null : Number(rate.toFixed(6)),
      });
      toast.success(`Transfer ${reference.trim()} recorded.`);
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record transfer</DialogTitle>
          <DialogDescription>
            For transfers that do not arrive automatically from Wise. The reference is the key the
            assignments hang on later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                required
                placeholder="WU-22"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="konto">Account</Label>
              <Select value={konto} onValueChange={setKonto}>
                <SelectTrigger id="konto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KONTEN.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount-eur">Amount in euros</Label>
              <Input
                id="amount-eur"
                inputMode="decimal"
                required
                placeholder="700.00"
                value={amountEur}
                onChange={(event) => setAmountEur(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount-ugx">
                Received in UGX <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="amount-ugx"
                inputMode="decimal"
                placeholder="2,749,600"
                value={amountUgx}
                onChange={(event) => setAmountUgx(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Rate</Label>
              <p className="flex h-10 items-center rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground tabular-nums">
                {rate === null ? "from amount and UGX" : formatQty(Number(rate.toFixed(2)))}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">
              Purpose <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTransfer.isPending}>
              {createTransfer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTransferDialog;
