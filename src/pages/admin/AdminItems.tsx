import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatTile from "@/admin/StatTile";
import { useNoIndex } from "@/admin/useNoIndex";
import { useProjectItems } from "@/admin/queries";
import { formatEur, formatQty, formatUgx } from "@/admin/format";

const STATUS_LABELS: Record<string, string> = {
  outstanding: "offen",
  partially_paid: "teilweise",
  paid: "bezahlt",
};

type Filter = "offen" | "bezahlt" | "alle";

const AdminItems = () => {
  useNoIndex("Positionen · Projektabrechnung");
  const items = useProjectItems();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("offen");

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (items.data ?? [])
      .filter((item) =>
        filter === "alle" ? true : filter === "offen" ? item.qty_open > 0 : item.qty_open === 0,
      )
      .filter(
        (item) =>
          needle === "" ||
          (item.item_name ?? "").toLowerCase().includes(needle) ||
          (item.phase ?? "").toLowerCase().includes(needle) ||
          item.project_item_id.toLowerCase().includes(needle),
      );
  }, [items.data, filter, search]);

  const totals = useMemo(() => {
    const all = items.data ?? [];
    return {
      openEur: all.reduce((sum, item) => sum + (item.open_eur ?? 0), 0),
      openUgx: all.reduce((sum, item) => sum + item.open_ugx, 0),
      paidUgx: all.reduce((sum, item) => sum + (item.paid_ugx ?? 0), 0),
    };
  }, [items.data]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Projektpositionen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zahlungsstand je Position. Die Mengen pflegt die Zuordnung an der Überweisung.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Noch offen" value={formatEur(totals.openEur)} hint="zum aktuellen Kurs" />
        <StatTile label="Noch offen" value={formatUgx(totals.openUgx)} hint="in Schilling" />
        <StatTile label="Bereits bezahlt" value={formatUgx(totals.paidUgx)} hint="in Schilling" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder="Position, Phase oder ID"
            aria-label="Positionen durchsuchen"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            <TabsTrigger value="offen">Offen</TabsTrigger>
            <TabsTrigger value="bezahlt">Bezahlt</TabsTrigger>
            <TabsTrigger value="alle">Alle</TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="text-sm text-muted-foreground">{rows.length} Positionen</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="px-0 py-0 sm:px-6 sm:py-4">
          {items.isPending ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3, 4].map((row) => (
                <Skeleton key={row} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Benötigt</TableHead>
                    <TableHead className="text-right">Bezahlt</TableHead>
                    <TableHead className="text-right">Offen</TableHead>
                    <TableHead className="text-right">Offen UGX</TableHead>
                    <TableHead className="text-right">Offen EUR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={item.project_item_id}>
                      <TableCell>
                        <p className="font-medium leading-tight">{item.item_name ?? item.project_item_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.project_item_id}
                          {item.phase ? ` · ${item.phase}` : ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "paid" ? "secondary" : "outline"}>
                          {STATUS_LABELS[item.status ?? ""] ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatQty(item.qty_needed)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatQty(item.qty_paid)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatQty(item.qty_open)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {formatUgx(item.open_ugx)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {formatEur(item.open_eur)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        Keine Position gefunden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminItems;
