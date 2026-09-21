import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Paperclip, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditableAmount from "./EditableAmount";
import { formatUgx } from "./format";
import {
  assignmentUgx,
  openReceipt,
  useDeleteAssignment,
  useUpdateAssignment,
  useUploadAssignmentReceipt,
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
  const uploadReceipt = useUploadAssignmentReceipt(transferId);
  const [pendingDelete, setPendingDelete] = useState<Assignment | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const patch = async (id: string, next: Partial<Assignment>, label: string) => {
    try {
      await updateAssignment.mutateAsync({ id, patch: next });
      toast.success(`${label} gespeichert.`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const upload = async (paymentLogId: string, file: File | undefined) => {
    if (!file) return;
    setUploadingId(paymentLogId);
    try {
      await uploadReceipt.mutateAsync({ paymentLogId, file });
      toast.success("Beleg hochgeladen.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploadingId(null);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    try {
      await deleteAssignment.mutateAsync(pendingDelete.payment_log_id);
      toast.success("Zuordnung entfernt.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPendingDelete(null);
    }
  };

  if (assignments.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Noch nichts zugeordnet. Rechts eine offene Position auswählen.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Menge</TableHead>
              <TableHead className="text-right">Ist-Betrag</TableHead>
              <TableHead>Belegnr.</TableHead>
              <TableHead>Beleg</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => {
              const item = itemById.get(assignment.item_id ?? "");
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
                      label="Menge"
                      value={assignment.qty_paid}
                      allowEmpty={false}
                      onCommit={(next) =>
                        next !== null && next > 0
                          ? patch(assignment.payment_log_id, { qty_paid: next }, "Menge")
                          : toast.error("Die Menge muss größer als 0 sein.")
                      }
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <EditableAmount
                      label="Ist-Betrag in UGX"
                      value={assignment.amount_paid_ugx}
                      placeholder={item ? String(Math.round(assignmentUgx(assignment, item))) : "UGX"}
                      onCommit={(next) =>
                        patch(assignment.payment_log_id, { amount_paid_ugx: next }, "Betrag")
                      }
                    />
                    {assignment.amount_paid_ugx === null && item && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        geschätzt {formatUgx(assignmentUgx(assignment, item))}
                      </p>
                    )}
                  </TableCell>

                  <TableCell>
                    <Input
                      aria-label="Belegnummer"
                      className="h-9 w-24"
                      defaultValue={assignment.expenditure_id ?? ""}
                      onBlur={(event) => {
                        const next = event.target.value.trim() === "" ? null : event.target.value.trim();
                        if (next !== assignment.expenditure_id) {
                          patch(assignment.payment_log_id, { expenditure_id: next }, "Belegnummer");
                        }
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <input
                      ref={(element) => {
                        fileInputs.current[assignment.payment_log_id] = element;
                      }}
                      type="file"
                      accept="application/pdf,image/*"
                      className="sr-only"
                      onChange={(event) => upload(assignment.payment_log_id, event.target.files?.[0])}
                    />
                    <div className="flex items-center gap-1">
                      {assignment.receipt_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openReceipt(assignment.receipt_url as string).catch((error: Error) =>
                              toast.error(error.message),
                            )
                          }
                        >
                          <FileText className="mr-1 h-4 w-4" aria-hidden="true" />
                          Öffnen
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={uploadingId === assignment.payment_log_id}
                        onClick={() => fileInputs.current[assignment.payment_log_id]?.click()}
                      >
                        {uploadingId === assignment.payment_log_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Paperclip className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span className="sr-only">
                          {assignment.receipt_url ? "Beleg ersetzen" : "Beleg hochladen"}
                        </span>
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(assignment)}
                      aria-label="Zuordnung entfernen"
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
            <AlertDialogTitle>Zuordnung entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Position gilt danach wieder als offen. Ein hochgeladener Beleg bleibt im Speicher, ist
              aber nicht mehr verknüpft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Entfernen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AssignmentsTable;
