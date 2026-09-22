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
  useNoIndex(`${transferId} · Projektabrechnung`);

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
    const datei = await pick();
    if (!datei) return;
    setIsSaving(true);
    try {
      await setTransferReceipt.mutateAsync(datei.url);
      toast.success(`Überweisungsbeleg „${datei.name}" verknüpft.`);
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
        <AlertTitle>Überweisung nicht gefunden</AlertTitle>
        <AlertDescription>
          Zu der Referenz {transferId} gibt es keine Überweisung.{" "}
          <Link to="/admin/transfers" className="underline">
            Zurück zur Liste
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
          Überweisungen
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{transfer.external_transaction_id}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(transfer.date)} · {transfer.konto}
          {transfer.reference ? ` · ${transfer.reference}` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Überwiesen"
          value={formatEur(transferredEur)}
          hint={
            transfer.fee_eur > 0
              ? `${transfer.konto} · ${formatEur(transfer.fee_eur)} Gebühr`
              : transfer.konto
          }
        />
        <StatTile
          label="Angekommen"
          value={receivedUgx === null ? "nicht erfasst" : formatUgx(receivedUgx)}
          hint={transfer.exchange_rate ? `Kurs ${transfer.exchange_rate}` : "kein Kurs hinterlegt"}
        />
        <StatTile
          label="Zugeordnet"
          value={formatUgx(assignedUgx)}
          hint={assignedEur === null ? undefined : `${formatEur(assignedEur)} zum Planungskurs`}
        />
        {receivedUgx === null ? (
          <StatTile
            label="Rest in Euro"
            value={assignedEur === null ? "–" : formatEur(transferredEur - assignedEur)}
            hint="überwiesen minus zugeordnet"
            tone="warning"
          />
        ) : (
          <StatTile
            label="Rest in UGX"
            value={formatUgx(receivedUgx - assignedUgx)}
            hint="angekommen minus zugeordnet"
            tone={Math.abs(receivedUgx - assignedUgx) < 1 ? "positive" : "warning"}
          />
        )}
      </div>

      <Card className="shadow-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm font-medium">Überweisungsbeleg</p>
            <p className="text-xs text-muted-foreground">
              Beleg des Spendentransfers, einer je Transfer.
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
                Öffnen
              </Button>
            )}
            <Button variant="secondary" size="sm" disabled={isPicking || isSaving} onClick={belegWaehlen}>
              {isSaving || isPicking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Paperclip className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {transfer.receipt_url ? "Ersetzen" : "Aus Drive wählen"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="shadow-card lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Zugeordnete Positionen</CardTitle>
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
            <CardTitle className="text-base">Offene Positionen</CardTitle>
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
