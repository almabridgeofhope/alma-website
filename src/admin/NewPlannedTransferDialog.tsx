import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { monthInputToDate, nextMonthInput, useCreatePlannedTransfer } from "./planQueries";

interface NewPlannedTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Legt den Plan an und fuehrt direkt zu ihm, denn dort werden die Positionen gewaehlt. */
const NewPlannedTransferDialog = ({ open, onOpenChange }: NewPlannedTransferDialogProps) => {
  const navigate = useNavigate();
  const createPlan = useCreatePlannedTransfer();
  const [month, setMonth] = useState(nextMonthInput);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (month === "" || title.trim() === "") {
      toast.error("Please enter a month and a title.");
      return;
    }
    try {
      const planId = await createPlan.mutateAsync({
        geplantFuer: monthInputToDate(month),
        bezeichnung: title.trim(),
        kommentar: comment.trim() === "" ? null : comment.trim(),
      });
      onOpenChange(false);
      setMonth(nextMonthInput());
      setTitle("");
      setComment("");
      navigate(`/admin/planned-transfers/${encodeURIComponent(planId)}`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan a transfer</DialogTitle>
          <DialogDescription>
            Which month and what for. The items follow on the next page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="plan-month">Month</Label>
              <Input
                id="plan-month"
                type="month"
                required
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="plan-title">Title</Label>
              <Input
                id="plan-title"
                required
                autoFocus
                placeholder="e.g. Drilling and pump"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-comment">Comment</Label>
            <Textarea
              id="plan-comment"
              rows={2}
              placeholder="Optional"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPlan.isPending}>
              {createPlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Create and choose items
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewPlannedTransferDialog;
