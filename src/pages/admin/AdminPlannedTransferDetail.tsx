import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Loader2, Send, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EditableAmount from "@/admin/EditableAmount";
import OpenItemsPicker from "@/admin/OpenItemsPicker";
import { PlanStatus } from "@/admin/PlannedTransfersCard";
import StatTile from "@/admin/StatTile";
import { useNoIndex } from "@/admin/useNoIndex";
import { formatDate, formatEur, formatQty, formatUgx, parseAmount } from "@/admin/format";
import { unitCostUgx, useEurRate, useProjectItems } from "@/admin/queries";
import {
  formatPlanMonth,
  monthInputToDate,
  plannedQtyByItem,
  useAddPlannedItem,
  usePlannedTransferItems,
  usePlannedTransfers,
  useRemovePlannedItem,
  useUpdatePlannedItem,
  useMarkPlannedTransferSent,
  useUpdatePlannedTransfer,
  type PlannedTransferPatch,
  type SentResult,
} from "@/admin/planQueries";
import type { PlannedTransfer, ProjectItem } from "@/admin/types";

const AdminPlannedTransferDetail = () => {
  const { planId = "" } = useParams();
  const plans = usePlannedTransfers();
  const planItems = usePlannedTransferItems();
  const items = useProjectItems();
  const updatePlan = useUpdatePlannedTransfer();
  const updateItem = useUpdatePlannedItem();
  const removeItem = useRemovePlannedItem();
  const [selected, setSelected] = useState<ProjectItem | null>(null);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  const plan = (plans.data ?? []).find((candidate) => candidate.plan_transfer_id === planId);
  useNoIndex(`${plan?.bezeichnung ?? planId} · Project accounting`);

  const eigene = useMemo(
    () => (planItems.data ?? []).filter((item) => item.plan_transfer_id === planId),
    [planItems.data, planId],
  );
  const eigeneIds = useMemo(() => new Set(eigene.map((item) => item.item_id)), [eigene]);
  const anderswo = useMemo(() => plannedQtyByItem(planItems.data ?? [], planId), [planItems.data, planId]);
  const itemById = useMemo(
    () => new Map((items.data ?? []).map((item) => [item.project_item_id, item])),
    [items.data],
  );

  const waehlen = useCallback(
    (item: ProjectItem) => {
      if (eigeneIds.has(item.project_item_id)) {
        toast.info("Already in this plan — change the quantity in the list.");
        return;
      }
      setSelected(item);
    },
    [eigeneIds],
  );

  const speichern = async (patch: PlannedTransferPatch, meldung: string) => {
    try {
      await updatePlan.mutateAsync({ planId, patch });
      toast.success(meldung);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const mengeAendern = async (itemId: string, next: number | null) => {
    if (next === null || next <= 0) {
      toast.error("The quantity must be greater than 0.");
      return;
    }
    try {
      await updateItem.mutateAsync({ planId, itemId, qty: next });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const entfernen = async (itemId: string) => {
    try {
      await removeItem.mutateAsync({ planId, itemId });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (plans.isPending || planItems.isPending || items.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!plan) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Planned transfer not found</AlertTitle>
        <AlertDescription>
          There is no planned transfer {planId}.{" "}
          <Link to="/admin/transfers" className="underline">
            Back to the list
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const bearbeitbar = plan.status === "geplant";
  const gekappt = eigene.filter((item) => bearbeitbar && Number(item.qty_wirksam) < Number(item.qty_geplant));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/admin/transfers"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Transfers
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{plan.bezeichnung}</h1>
            <PlanStatus plan={plan} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Planned for {formatPlanMonth(plan.geplant_fuer)}
            {plan.kommentar ? ` · ${plan.kommentar}` : ""}
          </p>
        </div>
        {bearbeitbar && (
          <Button variant="outline" size="sm" onClick={() => setIsDiscardOpen(true)}>
            Discard plan
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Planned"
          value={formatEur(bearbeitbar ? plan.eur_wirksam : plan.eur_geplant)}
          hint={`${formatUgx(plan.ugx_geplant)} at the planning rate`}
        />
        <StatTile label="Items" value={String(plan.positionen)} />
        {plan.status === "ausgefuehrt" && plan.ist_eur !== null ? (
          <StatTile
            label="Transferred"
            value={formatEur(plan.ist_eur)}
            hint={`${formatEur(plan.ist_eur - plan.eur_geplant)} against the plan, ${formatDate(plan.ist_datum)}`}
            tone={plan.ist_eur > plan.eur_geplant ? "warning" : "positive"}
          />
        ) : (
          <StatTile
            label="Counted in"
            value={formatPlanMonth(plan.faellig_monat)}
            hint={plan.ueberfaellig ? "Overdue — counted in the current month until carried out or moved" : undefined}
            tone={plan.ueberfaellig ? "warning" : "default"}
          />
        )}
        {plan.status === "ausgefuehrt" && plan.external_transaction_id ? (
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <p className="text-sm text-muted-foreground">Carried out as</p>
            <Link
              to={`/admin/transfers/${encodeURIComponent(plan.external_transaction_id)}`}
              className="mt-1 block truncate text-lg font-semibold text-primary hover:underline"
            >
              {plan.external_transaction_id}
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <Label htmlFor="plan-month" className="text-sm font-normal text-muted-foreground">
              Month
            </Label>
            <Input
              id="plan-month"
              key={plan.geplant_fuer}
              type="month"
              className="mt-1"
              disabled={!bearbeitbar}
              defaultValue={plan.geplant_fuer.slice(0, 7)}
              onBlur={(event) => {
                const wert = event.target.value;
                if (wert !== "" && monthInputToDate(wert) !== plan.geplant_fuer) {
                  speichern({ geplant_fuer: monthInputToDate(wert) }, "Month saved.");
                }
              }}
            />
          </div>
        )}
      </div>

      {bearbeitbar && <Gesendet plan={plan} />}

      {gekappt.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Partly paid in the meantime</AlertTitle>
          <AlertDescription>
            {gekappt.map((item) => item.item_name ?? item.item_id).join(", ")} — only what is still open is
            counted. Reduce the quantity or remove the item.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className={bearbeitbar ? "shadow-card lg:col-span-3" : "shadow-card lg:col-span-5"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Planned items</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {eigene.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-0">
                No items yet. Choose them from the open items.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">UGX</TableHead>
                      <TableHead className="text-right">EUR</TableHead>
                      {bearbeitbar && <TableHead className="w-10" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eigene.map((item) => (
                      <TableRow key={item.item_id}>
                        <TableCell className="max-w-[16rem]">
                          <p className="truncate font-medium">{item.item_name ?? item.item_id}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.item_id} · {item.projekt ?? "–"} · {item.phase ?? "no phase"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          {bearbeitbar ? (
                            <div className="flex justify-end">
                              <EditableAmount
                                label={`Quantity for ${item.item_name ?? item.item_id}`}
                                value={Number(item.qty_geplant)}
                                allowEmpty={false}
                                onCommit={(next) => mengeAendern(item.item_id, next)}
                              />
                            </div>
                          ) : (
                            <span className="tabular-nums">{formatQty(item.qty_geplant)}</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                          {formatUgx(item.ugx_geplant)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">
                          {formatEur(item.eur_geplant)}
                        </TableCell>
                        {bearbeitbar && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove ${item.item_name ?? item.item_id} from the plan`}
                              onClick={() => entfernen(item.item_id)}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {plan.status === "ausgefuehrt" && (
              <p className="mt-3 px-4 text-xs text-muted-foreground sm:px-0">
                What was actually paid per item is on the transfer. Amounts here are at the planning rate.
              </p>
            )}
          </CardContent>
        </Card>

        {bearbeitbar && (
          <Card className="shadow-card lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Open items</CardTitle>
            </CardHeader>
            <CardContent>
              <OpenItemsPicker
                items={items.data ?? []}
                onPick={waehlen}
                markedItemIds={eigeneIds}
                markedLabel="in this plan"
                plannedQty={anderswo}
                forPlanning
                newItemLabel="Create and plan"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {selected && (
        <AddPlanItemDialog
          planId={planId}
          item={itemById.get(selected.project_item_id) ?? selected}
          frei={selected.qty_open - (anderswo.get(selected.project_item_id) ?? 0)}
          onClose={() => setSelected(null)}
        />
      )}

      <AlertDialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard “{plan.bezeichnung}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The forecast no longer counts it and its items become free to plan again. The plan stays on
              record as discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => speichern({ status: "verworfen" }, "Plan discarded.")}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface AddPlanItemDialogProps {
  planId: string;
  item: ProjectItem;
  /** Offen und nicht schon in einem anderen Plan. */
  frei: number;
  onClose: () => void;
}

const AddPlanItemDialog = ({ planId, item, frei, onClose }: AddPlanItemDialogProps) => {
  const addItem = useAddPlannedItem();
  const rate = useEurRate();
  const [qty, setQty] = useState(String(frei));

  useEffect(() => setQty(String(frei)), [frei]);

  const menge = parseAmount(qty);
  const ugx = menge === null ? null : menge * unitCostUgx(item);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (menge === null || menge <= 0) {
      toast.error("The quantity must be greater than 0.");
      return;
    }
    try {
      await addItem.mutateAsync({ planId, itemId: item.project_item_id, qty: menge });
      toast.success(`${item.item_name ?? item.project_item_id} planned.`);
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item.item_name ?? item.project_item_id}</DialogTitle>
          <DialogDescription>
            {item.project_item_id} · {formatQty(frei)} of {formatQty(item.qty_open)} open still unplanned · unit
            price {formatUgx(Math.round(unitCostUgx(item)))}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-qty">Quantity</Label>
            <Input
              id="plan-qty"
              inputMode="decimal"
              autoFocus
              required
              value={qty}
              onChange={(event) => setQty(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {ugx === null
                ? "–"
                : `${formatUgx(ugx)}${rate.data ? ` · ${formatEur(ugx / rate.data)} at the planning rate` : ""}`}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addItem.isPending}>
              {addItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Add to plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Beim Ueberweisen die Auftragsnummer von XE oder Wise eintragen. Kommt die Abbuchung mit
 * dieser Nummer herein, ordnet die Datenbank die Positionen selbst zu.
 */
const Gesendet = ({ plan }: { plan: PlannedTransfer }) => {
  const markSent = useMarkPlannedTransferSent();
  const [referenz, setReferenz] = useState("");

  const senden = async (next: string | null) => {
    try {
      const ergebnis = await markSent.mutateAsync({ planId: plan.plan_transfer_id, referenz: next });
      const meldung: Record<SentResult, string> = {
        waiting: `Marked as sent as ${next}. The items are assigned as soon as the debit comes in.`,
        "carried out": `The debit ${next} was already there — plan carried out.`,
        failed: "Marked as sent, but the assignment failed — see the note on the plan.",
        withdrawn: "No longer marked as sent.",
      };
      if (ergebnis === "failed") toast.error(meldung[ergebnis]);
      else toast.success(meldung[ergebnis]);
      setReferenz("");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (plan.gesendet_referenz) {
    return (
      <Card className="shadow-card">
        <CardContent className="space-y-3 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Send className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">
                  Sent as <span className="font-mono">{plan.gesendet_referenz}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {plan.gesendet_am ? `Marked on ${formatDate(plan.gesendet_am)}. ` : ""}
                  Waiting for the debit — the items are assigned automatically when it comes in.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" disabled={markSent.isPending} onClick={() => senden(null)}>
              Undo
            </Button>
          </div>
          {plan.automatik_fehler && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>The debit came in, but the items could not be assigned</AlertTitle>
              <AlertDescription>{plan.automatik_fehler}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-start gap-3">
          <Send className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">Sent?</p>
            <p className="text-xs text-muted-foreground">
              Enter the order number from XE or Wise (C2…). The items are assigned as soon as the debit
              with that number comes in.
            </p>
          </div>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (referenz.trim() !== "") void senden(referenz.trim());
          }}
        >
          <Input
            aria-label="Order number"
            placeholder="C21330281"
            className="h-9 w-40 font-mono"
            value={referenz}
            onChange={(event) => setReferenz(event.target.value)}
          />
          <Button type="submit" size="sm" disabled={referenz.trim() === "" || markSent.isPending}>
            {markSent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Mark as sent
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminPlannedTransferDetail;
