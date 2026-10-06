import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, CalendarClock, CheckCircle2, FileText, Loader2, Paperclip } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import AddAssignmentDialog from "@/admin/AddAssignmentDialog";
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
  useUpdateTransfer,
} from "@/admin/queries";
import {
  formatPlanMonth,
  plannedQtyByItem,
  useCarryOutPlannedTransfer,
  usePlannedTransferItems,
  usePlannedTransfers,
} from "@/admin/planQueries";
import type { ProjectItem, Transfer } from "@/admin/types";
import { cn } from "@/lib/utils";

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
  const [selected, setSelected] = useState<ProjectItem | null>(null);
  const planItems = usePlannedTransferItems();

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

  // Angekommen ist nur, was bestaetigt wurde — ein UGX-Betrag vom Wise-Sync zaehlt noch nicht.
  const receivedUgx =
    transfer?.erhalten_bestaetigt_am && transfer.original_amount !== null
      ? absolute(transfer.original_amount)
      : null;
  const transferredEur = absolute(transfer?.amount);
  const assignedEur = rate.data ? assignedUgx / rate.data : null;

  // Was noch nicht zugeordnet ist: in UGX, sobald die Ankunft bestaetigt ist, sonst in Euro.
  const rest =
    receivedUgx !== null
      ? Math.abs(receivedUgx - assignedUgx) >= 1
        ? `${formatUgx(receivedUgx - assignedUgx)} not assigned yet`
        : null
      : assignedEur !== null && Math.abs(transferredEur - assignedEur) >= 0.5
        ? `${formatEur(transferredEur - assignedEur)} not assigned yet`
        : null;

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
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
        <Erledigt transfer={transfer} transferId={transferId} rest={rest} />
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
          value={receivedUgx === null ? "not confirmed" : formatUgx(receivedUgx)}
          hint={transfer.exchange_rate ? `Rate ${transfer.exchange_rate}` : "rate follows the confirmation"}
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

      {/* Buchungsangaben und Planuebernahme teilen sich eine Zeile; ohne offene Plaene nimmt die Buchung sie ganz. */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <TransferBuchung transfer={transfer} transferId={transferId} className="lg:flex-[3]" />
        <Card className="shadow-card lg:shrink-0">
          <CardContent className="space-y-1.5 py-4">
            <Label title="Receipt for the donation transfer, one per transfer">Bank receipt</Label>
            <div className="flex items-center gap-2">
              {transfer.receipt_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => openReceipt(transfer.receipt_url as string)}
                >
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                  Open
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="h-9"
                disabled={isPicking || isSaving}
                onClick={belegWaehlen}
              >
                {isSaving || isPicking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Paperclip className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {transfer.receipt_url ? "Replace" : "From Drive"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <FromPlan transferId={transferId} transferredEur={transferredEur} className="lg:flex-[2]" />
      </div>


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
              items={items.data ?? []}
              onPick={setSelected}
              markedItemIds={new Set((assignments.data ?? []).map((a) => a.item_id ?? ""))}
              markedLabel="already assigned"
              plannedQty={plannedQtyByItem(planItems.data ?? [])}
              newItemLabel="Create and assign"
            />
          </CardContent>
        </Card>
      </div>

      {selected && (
        <AddAssignmentDialog transferId={transferId} item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

/** Erledigt ist ein eigenes Kennzeichen: ein Rest darf stehen bleiben, er wird nur genannt. */
const Erledigt = ({ transfer, transferId, rest }: { transfer: Transfer; transferId: string; rest: string | null }) => {
  const updateTransfer = useUpdateTransfer(transferId);
  const erledigt = transfer.erledigt_am !== null;

  const umschalten = async () => {
    try {
      await updateTransfer.mutateAsync({
        transactionId: transfer.transaction_id,
        patch: { erledigt_am: erledigt ? null : new Date().toISOString() },
      });
      toast.success(erledigt ? "Transfer reopened." : rest ? `Marked as done — ${rest}.` : "Marked as done.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {erledigt && (
          <Badge variant="secondary">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            done {formatDate(transfer.erledigt_am as string)}
          </Badge>
        )}
        <Button variant={erledigt ? "ghost" : "outline"} size="sm" disabled={updateTransfer.isPending} onClick={umschalten}>
          {updateTransfer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {erledigt ? "Reopen" : "Mark as done"}
        </Button>
      </div>
      {rest && !erledigt && <p className="text-xs text-muted-foreground">{rest}</p>}
    </div>
  );
};

/**
 * Ein geplanter Transfer wird hier zur Wirklichkeit: seine Positionen werden Zuordnungen
 * dieser Ueberweisung. Steht nur da, solange es offene Plaene gibt.
 */
const FromPlan = ({
  transferId,
  transferredEur,
  className,
}: {
  transferId: string;
  transferredEur: number;
  className?: string;
}) => {
  const plans = usePlannedTransfers();
  const carryOut = useCarryOutPlannedTransfer(transferId);
  const offen = (plans.data ?? []).filter((plan) => plan.status === "geplant");
  const [planId, setPlanId] = useState<string>("");

  if (offen.length === 0) return null;
  const plan = offen.find((candidate) => candidate.plan_transfer_id === planId);

  const uebernehmen = async () => {
    if (!plan) return;
    try {
      const angelegt = await carryOut.mutateAsync(plan.plan_transfer_id);
      toast.success(
        angelegt === 1
          ? `“${plan.bezeichnung}” carried out, 1 item assigned.`
          : `“${plan.bezeichnung}” carried out, ${angelegt} items assigned.`,
      );
      setPlanId("");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Card className={cn("shadow-card", className)}>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">From a planned transfer</p>
            <p className="text-xs text-muted-foreground">
              {plan
                ? `${plan.positionen} items, ${formatEur(plan.eur_wirksam)} planned against ${formatEur(transferredEur)} transferred. Quantities and amounts can be adjusted afterwards.`
                : "Takes the planned items over as assignments and marks the plan as carried out."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger className="min-w-0 flex-1" aria-label="Choose a planned transfer">
              <SelectValue placeholder="Choose a plan" />
            </SelectTrigger>
            <SelectContent>
              {offen.map((candidate) => (
                <SelectItem key={candidate.plan_transfer_id} value={candidate.plan_transfer_id}>
                  {formatPlanMonth(candidate.geplant_fuer)} · {candidate.bezeichnung}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!plan || carryOut.isPending} onClick={uebernehmen}>
            {carryOut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Take over
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTransferDetail;
