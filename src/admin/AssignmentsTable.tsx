import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, FileText, Loader2, Paperclip, Trash2 } from "lucide-react";
import { useReceiptPicker } from "./useReceiptPicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditableAmount from "./EditableAmount";
import { formatUgx } from "./format";
import {
  assignmentUgx,
  assignmentUnitUgx,
  isReceiptFile,
  openReceipt,
  unitCostUgx,
  useDeleteAssignment,
  useSetAssignmentReceipt,
  useUpdateAssignment,
} from "./queries";
import type { Assignment, ProjectItem } from "./types";

interface AssignmentsTableProps {
  transferId: string;
  assignments: Assignment[];
  itemById: Map<string, ProjectItem>;
}

const AssignmentsTable = ({ transferId, assignments, itemById }: AssignmentsTableProps) => {
  const updateAssignment = useUpdateAssignment(transferId);
  const deleteAssignment = useDeleteAssignment(transferId);
  const setReceipt = useSetAssignmentReceipt(transferId);
  const { pick, isPicking } = useReceiptPicker();
  const [pendingDelete, setPendingDelete] = useState<Assignment | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const patch = async (id: string, next: Partial<Assignment>, label: string) => {
    try {
      await updateAssignment.mutateAsync({ id, patch: next });
      toast.success(`${label} saved.`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Menge, Einzelbetrag und Gesamtbetrag haengen aneinander: gespeichert wird nur der
  // Gesamtbetrag, die beiden anderen Felder rechnen ihn um. Der Einzelbetrag ist dabei
  // der bleibende Wert — wer die Menge aendert, meint selten einen anderen Stueckpreis.
  const changeQty = (assignment: Assignment, next: number | null) => {
    if (next === null || next <= 0) {
      toast.error("The quantity must be greater than 0.");
      return;
    }
    const unit = assignmentUnitUgx(assignment);
    if (unit === null) {
      patch(assignment.payment_log_id, { qty_paid: next }, "Quantity");
      return;
    }
    patch(
      assignment.payment_log_id,
      { qty_paid: next, amount_paid_ugx: Math.round(unit * next) },
      "Quantity and actual amount",
    );
  };

  const changeUnit = (assignment: Assignment, next: number | null) => {
    if (next === null) {
      patch(assignment.payment_log_id, { amount_paid_ugx: null }, "Actual amount");
      return;
    }
    const qty = assignment.qty_paid ?? 0;
    if (qty <= 0) {
      toast.error("Without a quantity the per-unit amount cannot be converted.");
      return;
    }
    patch(assignment.payment_log_id, { amount_paid_ugx: Math.round(next * qty) }, "Actual amount");
  };

  const belegWaehlen = async (paymentLogId: string) => {
    const datei = await pick("position");
    if (!datei) return;
    setBusyId(paymentLogId);
    try {
      await setReceipt.mutateAsync({ paymentLogId, receiptUrl: datei.url });
      toast.success(`Receipt “${datei.name}” linked.`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    try {
      await deleteAssignment.mutateAsync(pendingDelete.payment_log_id);
      toast.success("Assignment removed.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPendingDelete(null);
    }
  };

  if (assignments.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nothing assigned yet. Pick an open item on the right.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Actual per unit</TableHead>
              <TableHead className="text-right">Actual total</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => {
              const item = itemById.get(assignment.item_id ?? "");
              const receipt = assignment.expenditure_id;
              const hasFile = isReceiptFile(receipt);
              return (
                <TableRow key={assignment.payment_log_id}>
                  <TableCell>
                    <p className="font-medium leading-tight">{item?.item_name ?? assignment.item_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.item_id}
                      {item?.phase ? ` · ${item.phase}` : ""}
                    </p>
                  </TableCell>

                  <TableCell className="text-right">
                    <EditableAmount
                      label="Quantity"
                      value={assignment.qty_paid}
                      allowEmpty={false}
                      onCommit={(next) => changeQty(assignment, next)}
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <EditableAmount
                      label="Actual amount per unit in UGX"
                      value={assignmentUnitUgx(assignment)}
                      placeholder={item ? String(Math.round(unitCostUgx(item))) : "UGX"}
                      onCommit={(next) => changeUnit(assignment, next)}
                    />
                    {assignmentUnitUgx(assignment) === null && item && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        planned {formatUgx(Math.round(unitCostUgx(item)))}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <EditableAmount
                      label="Actual amount in UGX"
                      value={assignment.amount_paid_ugx}
                      placeholder={item ? String(Math.round(assignmentUgx(assignment, item))) : "UGX"}
                      onCommit={(next) =>
                        patch(assignment.payment_log_id, { amount_paid_ugx: next }, "Ist-Betrag")
                      }
                    />
                    {assignment.amount_paid_ugx === null && item && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        estimated {formatUgx(assignmentUgx(assignment, item))}
                      </p>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      {hasFile && receipt && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto px-0"
                          onClick={() => openReceipt(receipt)}
                        >
                          <FileText className="mr-1 h-4 w-4 shrink-0" aria-hidden="true" />
                          open
                        </Button>
                      )}

                      {!hasFile && receipt && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden="true" />
                          No. {receipt}
                        </span>
                      )}

                      {!receipt && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                          missing
                        </span>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPicking || busyId === assignment.payment_log_id}
                        onClick={() => belegWaehlen(assignment.payment_log_id)}
                      >
                        {busyId === assignment.payment_log_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Paperclip className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span className="sr-only">{hasFile ? "Replace receipt" : "Add receipt"}</span>
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(assignment)}
                      aria-label="Remove assignment"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              The item counts as open again afterwards. The uploaded receipt stays in Drive but is
              no longer linked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AssignmentsTable;
