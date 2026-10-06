import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronRight, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import NewPlannedTransferDialog from "./NewPlannedTransferDialog";
import { formatEur } from "./format";
import { formatPlanMonth, usePlannedTransfers } from "./planQueries";
import type { PlannedTransfer } from "./types";

export const PlanStatus = ({ plan }: { plan: PlannedTransfer }) => {
  if (plan.status === "ausgefuehrt") return <Badge variant="outline">carried out</Badge>;
  if (plan.status === "verworfen") return <Badge variant="outline">discarded</Badge>;
  if (plan.automatik_fehler) return <Badge variant="destructive">assignment failed</Badge>;
  if (plan.gesendet_referenz) return <Badge variant="default">sent</Badge>;
  if (plan.ueberfaellig) return <Badge variant="destructive">overdue</Badge>;
  return <Badge variant="secondary">planned</Badge>;
};

/**
 * Die geplanten Transfers ueber der Liste der gebuchten. Ausgefuehrte stehen auf Wunsch
 * darunter — fuer den Vergleich Plan gegen Ist, nicht fuer die tägliche Arbeit.
 */
const PlannedTransfersCard = () => {
  const plans = usePlannedTransfers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const offen = (plans.data ?? []).filter((plan) => plan.status === "geplant");
  const erledigt = (plans.data ?? [])
    .filter((plan) => plan.status === "ausgefuehrt")
    .sort((a, b) => b.geplant_fuer.localeCompare(a.geplant_fuer));
  const sichtbar = showDone ? [...offen, ...erledigt] : offen;

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Planned transfers</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Items set aside for a coming month. The finance forecast subtracts them in that month.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          Plan transfer
        </Button>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {plans.isError && (
          <Alert variant="destructive" className="mx-4 mb-4 sm:mx-0">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Loading failed</AlertTitle>
            <AlertDescription>{(plans.error as Error).message}</AlertDescription>
          </Alert>
        )}

        {plans.isPending && <Skeleton className="mx-4 h-16 sm:mx-0" />}

        {plans.isSuccess && sichtbar.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground sm:px-0">
            Nothing planned yet.
          </p>
        )}

        {sichtbar.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Planned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sichtbar.map((plan) => (
                  <TableRow key={plan.plan_transfer_id}>
                    <TableCell className="whitespace-nowrap">{formatPlanMonth(plan.geplant_fuer)}</TableCell>
                    <TableCell className="max-w-[16rem]">
                      <p className="truncate font-medium" title={plan.bezeichnung}>
                        {plan.bezeichnung}
                      </p>
                      {plan.kommentar && (
                        <p className="truncate text-xs text-muted-foreground" title={plan.kommentar}>
                          {plan.kommentar}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{plan.positionen}</TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatEur(plan.status === "geplant" ? plan.eur_wirksam : plan.eur_geplant)}
                      {plan.status === "ausgefuehrt" && plan.ist_eur !== null && (
                        <p className="text-xs text-muted-foreground">{formatEur(plan.ist_eur)} sent</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <PlanStatus plan={plan} />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/admin/planned-transfers/${encodeURIComponent(plan.plan_transfer_id)}`}
                        className="flex items-center justify-end text-primary hover:underline"
                        aria-label={`Open planned transfer ${plan.bezeichnung}`}
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {erledigt.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDone((bisher) => !bisher)}
            className="mx-4 mt-3 text-sm text-muted-foreground hover:text-foreground sm:mx-0"
          >
            {showDone ? "Hide carried out plans" : `Show ${erledigt.length} carried out`}
          </button>
        )}
      </CardContent>

      <NewPlannedTransferDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </Card>
  );
};

export default PlannedTransfersCard;
