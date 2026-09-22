import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, FileText, Loader2, Paperclip } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AssignmentsTable from "@/admin/AssignmentsTable";
import OpenItemsPicker from "@/admin/OpenItemsPicker";
import StatTile from "@/admin/StatTile";
import TransferBuchung from "@/admin/TransferBuchung";
import { useNoIndex } from "@/admin/useNoIndex";
import { useReceiptPicker } from "@/admin/useReceiptPicker";
import { absolute, formatDate, formatEur, formatUgx } from "@/admin/format";
import {
  assignmentUgx,
  openReceipt,
  useAssignments,
  useEurRate,
  useProjectItems,
  useTransferSummaries,
  useSetTransferReceipt,
} from "@/admin/queries";

const AdminTransferDetail = () => {
  const { transferId = "" } = useParams();
  useNoIndex(`${transferId} · Project accounting`);

  const transfers = useTransferSummaries();
  const items = useProjectItems();
  const assignments = useAssignments(transferId);
  const rate = useEurRate();
  const setTransferReceipt = useSetTransferReceipt(transferId);
  const { pick, isPicking } = useReceiptPicker();
  const [isSaving, setIsSaving] = useState(false);

  const transfer = (transfers.data ?? []).find(
    (candidate) => candidate.external_transaction_id === transferId,
  );

  const itemById = useMemo(
    () => new Map((items.data ?? []).map((item) => [item.project_item_id, item])),
    [items.data],
  );

  const assignedUgx = (assignments.data ?? []).reduce(
    (sum, assignment) => sum + assignmentUgx(assignment, itemById.get(assignment.item_id ?? "")),
    0,
  );

  const receivedUgx = transfer?.original_amount === null ? null : absolute(transfer?.original_amount);
  const transferredEur = absolute(transfer?.amount);
  const assignedEur = rate.data ? assignedUgx / rate.data : null;

  const belegWaehlen = async () => {
    const datei = await pick("ueberweisung");
    if (!datei) return;
    setIsSaving(true);
    try {
      await setTransferReceipt.mutateAsync(datei.url);
      toast.success(`Transfer receipt “${datei.name}” linked.`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (transfers.isPending || items.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!transfer) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Transfer not found</AlertTitle>
        <AlertDescription>
          There is no transfer with the reference {transferId}.{" "}
          <Link to="/admin/transfers" className="underline">
            Back to the list
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/transfers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Transfers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {transfer.buchung_nr !== null && (
            <span className="mr-2 text-muted-foreground">No. {transfer.buchung_nr}</span>
          )}
          {transfer.external_transaction_id}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(transfer.date)} · {transfer.konto}
          {transfer.reference ? ` · ${transfer.reference}` : ""}
        </p>
        {transfer.zweck && <p className="mt-1 text-sm">{transfer.zweck}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Transferred"
          value={formatEur(transferredEur)}
          hint={
            transfer.fee_eur > 0
              ? `${transfer.konto} · ${formatEur(transfer.fee_eur)} fee`
              : transfer.konto
          }
        />
        <StatTile
          label="Received"
          value={receivedUgx === null ? "not recorded" : formatUgx(receivedUgx)}
          hint={transfer.exchange_rate ? `Rate ${transfer.exchange_rate}` : "no rate on file"}
        />
        <StatTile
          label="Assigned"
          value={formatUgx(assignedUgx)}
          hint={assignedEur === null ? undefined : `${formatEur(assignedEur)} at the planning rate`}
        />
        {receivedUgx === null ? (
          <StatTile
            label="Remainder in euros"
            value={assignedEur === null ? "–" : formatEur(transferredEur - assignedEur)}
            hint="transferred minus assigned"
            tone="warning"
          />
        ) : (
          <StatTile
            label="Remainder in UGX"
            value={formatUgx(receivedUgx - assignedUgx)}
            hint="received minus assigned"
            tone={Math.abs(receivedUgx - assignedUgx) < 1 ? "positive" : "warning"}
          />
        )}
      </div>

      <TransferBuchung transfer={transfer} transferId={transferId} />

      <Card className="shadow-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm font-medium">Transfer receipt</p>
            <p className="text-xs text-muted-foreground">
              Receipt for the donation transfer, one per transfer.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {transfer.receipt_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openReceipt(transfer.receipt_url as string)}
              >
                <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                Open
              </Button>
            )}
            <Button variant="secondary" size="sm" disabled={isPicking || isSaving} onClick={belegWaehlen}>
              {isSaving || isPicking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Paperclip className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {transfer.receipt_url ? "Replace" : "Choose from Drive"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="shadow-card lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Assigned items</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {assignments.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <AssignmentsTable
                transferId={transferId}
                assignments={assignments.data ?? []}
                itemById={itemById}
              />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Open items</CardTitle>
          </CardHeader>
          <CardContent>
            <OpenItemsPicker
              transferId={transferId}
              items={items.data ?? []}
              assignedItemIds={new Set((assignments.data ?? []).map((a) => a.item_id ?? ""))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTransferDetail;
