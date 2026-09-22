import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronRight, FileText, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNoIndex } from "@/admin/useNoIndex";
import { useProjectItems, useTransferSummaries } from "@/admin/queries";
import { absolute, formatDate, formatEur, formatUgx } from "@/admin/format";
import NewTransferDialog from "@/admin/NewTransferDialog";
import StatTile from "@/admin/StatTile";

const AdminTransfers = () => {
  useNoIndex("Transfers · Project accounting");
  const items = useProjectItems();
  const transfers = useTransferSummaries();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openNeed = useMemo(() => {
    const rows = items.data ?? [];
    return {
      eur: rows.reduce((sum, item) => sum + (item.open_eur ?? 0), 0),
      count: rows.filter((item) => item.qty_open > 0).length,
    };
  }, [items.data]);

  const unassigned = (transfers.data ?? []).filter((transfer) => transfer.assignmentCount === 0).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Transfers to Uganda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every transfer is assigned to the items it paid for.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Record transfer
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Open need" value={formatEur(openNeed.eur)} hint="at the current rate" />
        <StatTile label="Open items" value={String(openNeed.count)} hint="with a remaining quantity" />
        <StatTile
          label="Unassigned"
          value={String(unassigned)}
          hint="transfers without an item"
          tone={unassigned > 0 ? "warning" : "default"}
        />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All transfers</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {transfers.isError && (
            <Alert variant="destructive" className="mx-4 mb-4 sm:mx-0">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Loading failed</AlertTitle>
              <AlertDescription>{(transfers.error as Error).message}</AlertDescription>
            </Alert>
          )}

          {transfers.isPending && (
            <div className="space-y-2 px-4 sm:px-0">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-12 w-full" />
              ))}
            </div>
          )}

          {transfers.isSuccess && transfers.data.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-0">
              No transfer recorded yet.
            </p>
          )}

          {transfers.isSuccess && transfers.data.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-right">No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-40">Reference</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead>Receipts</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.data.map((transfer) => {
                    const id = transfer.external_transaction_id;
                    return (
                      <TableRow key={transfer.transaction_id} className={id ? "cursor-pointer" : undefined}>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {transfer.buchung_nr ?? "–"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(transfer.date)}</TableCell>
                        <TableCell className="max-w-[10rem] font-medium">
                          {id ? (
                            <p className="truncate" title={id}>
                              {id}
                            </p>
                          ) : (
                            <Badge variant="outline">no reference</Badge>
                          )}
                          {transfer.zweck && (
                            <p className="truncate text-xs font-normal text-muted-foreground" title={transfer.zweck}>
                              {transfer.zweck}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{transfer.konto}</TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">
                          {formatEur(absolute(transfer.amount))}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                          {transfer.fee_eur > 0 ? formatEur(transfer.fee_eur) : "–"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                          {transfer.assignedUgx > 0 ? formatUgx(transfer.assignedUgx) : "–"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {transfer.assignmentCount > 0 ? (
                            transfer.assignmentCount
                          ) : (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                            {transfer.receiptCount}
                            {transfer.receipt_url && <Badge variant="secondary">bank receipt</Badge>}
                          </span>
                        </TableCell>
                        <TableCell>
                          {id ? (
                            <Link
                              to={`/admin/transfers/${encodeURIComponent(id)}`}
                              className="flex items-center justify-end text-primary hover:underline"
                              aria-label={`Open transfer ${id}`}
                            >
                              <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {transfers.isSuccess && transfers.data.some((transfer) => !transfer.external_transaction_id) && (
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Transfers without a reference</AlertTitle>
          <AlertDescription>
            Assignments hang on the transfer reference. While it is missing the transfer cannot be
            opened — the reference has to be added directly in the database.
          </AlertDescription>
        </Alert>
      )}

      <NewTransferDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
};

export default AdminTransfers;
