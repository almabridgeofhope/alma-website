import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewProjectItemDialog from "@/admin/NewProjectItemDialog";
import StatTile from "@/admin/StatTile";
import { useNoIndex } from "@/admin/useNoIndex";
import { useProjectItems } from "@/admin/queries";
import { formatEur, formatQty, formatUgx } from "@/admin/format";
import type { ProjectItem } from "@/admin/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  outstanding: "open",
  partially_paid: "partly paid",
  paid: "paid",
};

const ALL = "alle";

type StatusFilter = "offen" | "bezahlt" | "alle";

interface Summe {
  schluessel: string;
  name: string;
  positionen: number;
  offenePositionen: number;
  gesamtUgx: number;
  bezahltUgx: number;
  offenUgx: number;
  offenEur: number;
}

const summieren = (schluessel: string, name: string, rows: ProjectItem[]): Summe => ({
  schluessel,
  name,
  positionen: rows.length,
  offenePositionen: rows.filter((item) => item.qty_open > 0).length,
  gesamtUgx: rows.reduce((sum, item) => sum + (item.total_ugx ?? 0), 0),
  bezahltUgx: rows.reduce((sum, item) => sum + (item.paid_ugx ?? 0), 0),
  offenUgx: rows.reduce((sum, item) => sum + item.open_ugx, 0),
  offenEur: rows.reduce((sum, item) => sum + (item.open_eur ?? 0), 0),
});

const anteilBezahlt = (summe: Summe): number =>
  summe.gesamtUgx > 0 ? Math.round((summe.bezahltUgx / summe.gesamtUgx) * 100) : 0;

const gruppieren = (rows: ProjectItem[], schluessel: (item: ProjectItem) => string): Map<string, ProjectItem[]> => {
  const gruppen = new Map<string, ProjectItem[]>();
  rows.forEach((item) => {
    const key = schluessel(item);
    gruppen.set(key, [...(gruppen.get(key) ?? []), item]);
  });
  return gruppen;
};

const AdminItems = () => {
  useNoIndex("Items · Project accounting");
  const items = useProjectItems();
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState(ALL);
  const [phase, setPhase] = useState(ALL);
  const [status, setStatus] = useState<StatusFilter>("offen");
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);

  // Eigene Memo, damit die Auswertungen unten nicht bei jedem Render neu rechnen.
  // Gezeigt wird nur, woran gerade gearbeitet wird: Projekte mit Status ongoing.
  // Geplante Projekte wie der Farm wuerden die Liste fuellen, ohne dass jemand
  // etwas damit tut — in der Finanzvorschau bleiben sie sichtbar.
  const alle = useMemo(
    () => (items.data ?? []).filter((item) => item.projekt_status === "ongoing"),
    [items.data],
  );

  const projects = useMemo(() => {
    const byId = new Map<string, string>();
    alle.forEach((item) => byId.set(item.project_id, item.projekt ?? item.project_id));
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [alle]);

  const phaseOptions = useMemo(() => {
    const names = alle
      .filter((item) => projectId === ALL || item.project_id === projectId)
      .map((item) => item.phase)
      .filter((value): value is string => !!value);
    return Array.from(new Set(names)).sort();
  }, [alle, projectId]);

  /** Die Aufschlüsselung folgt dem Projektfilter, nicht dem Status- oder Suchfilter. */
  const proProjekt = useMemo(() => {
    const relevant = alle.filter((item) => projectId === ALL || item.project_id === projectId);
    return Array.from(gruppieren(relevant, (item) => item.project_id), ([id, rows]) => ({
      projekt: summieren(id, rows[0]?.projekt ?? id, rows),
      phasen: Array.from(gruppieren(rows, (item) => item.phase ?? "ohne Phase"), ([name, phaseRows]) =>
        summieren(name, name, phaseRows),
      ).sort((a, b) => b.offenUgx - a.offenUgx),
    })).sort((a, b) => b.projekt.offenUgx - a.projekt.offenUgx);
  }, [alle, projectId]);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return alle
      .filter((item) => projectId === ALL || item.project_id === projectId)
      .filter((item) => phase === ALL || item.phase === phase)
      .filter((item) =>
        status === "alle" ? true : status === "offen" ? item.qty_open > 0 : item.qty_open === 0,
      )
      .filter(
        (item) =>
          needle === "" ||
          (item.item_name ?? "").toLowerCase().includes(needle) ||
          (item.phase ?? "").toLowerCase().includes(needle) ||
          item.project_item_id.toLowerCase().includes(needle),
      );
  }, [alle, projectId, phase, status, search]);

  const gesamt = summieren("gesamt", "Total", alle);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Project items</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Payment status per item. The quantities come from the assignments on each transfer.
          </p>
        </div>
        <Button onClick={() => setIsNewItemOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          New item
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Still open" value={formatEur(gesamt.offenEur)} hint="at the current rate" />
        <StatTile label="Still open" value={formatUgx(gesamt.offenUgx)} hint="in shillings" />
        <StatTile
          label="Already paid"
          value={`${anteilBezahlt(gesamt)} %`}
          hint={`${formatUgx(gesamt.bezahltUgx)} of ${formatUgx(gesamt.gesamtUgx)}`}
          tone="positive"
        />
      </div>

      {items.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {proProjekt.map(({ projekt, phasen }) => (
            <Card key={projekt.schluessel} className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-baseline justify-between gap-3">
                  <CardTitle className="text-base">{projekt.name}</CardTitle>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatEur(projekt.offenEur)} open
                  </span>
                </div>
                <Progress value={anteilBezahlt(projekt)} className="mt-2 h-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {anteilBezahlt(projekt)} % paid · {projekt.offenePositionen} of {projekt.positionen}{" "}
                  items open
                </p>
              </CardHeader>

              <CardContent className="space-y-1">
                {phasen.map((p) => (
                  <button
                    key={p.schluessel}
                    type="button"
                    onClick={() => {
                      setProjectId(projekt.schluessel);
                      setPhase(p.name);
                      setStatus(p.offenUgx > 0 ? "offen" : "alle");
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent",
                      phase === p.name && "bg-primary-light",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                    <Progress value={anteilBezahlt(p)} className="h-1.5 w-20 shrink-0" />
                    <span className="w-28 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                      {p.offenUgx > 0 ? formatUgx(p.offenUgx) : "complete"}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder="Item, phase or ID"
            aria-label="Search items"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Select
          value={projectId}
          onValueChange={(value) => {
            setProjectId(value);
            setPhase(ALL);
          }}
        >
          <SelectTrigger className="w-48" aria-label="Filter by project">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={phase} onValueChange={setPhase}>
          <SelectTrigger className="w-56" aria-label="Filter by phase">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All phases</SelectItem>
            {phaseOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="offen">Open</TabsTrigger>
            <TabsTrigger value="bezahlt">Paid</TabsTrigger>
            <TabsTrigger value="alle">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="text-sm text-muted-foreground">{rows.length} items</p>

        {(projectId !== ALL || phase !== ALL || search !== "") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setProjectId(ALL);
              setPhase(ALL);
              setSearch("");
            }}
          >
            Reset filters
          </Button>
        )}
      </div>

      <NewProjectItemDialog
        open={isNewItemOpen}
        onOpenChange={setIsNewItemOpen}
        defaultProjectId={projectId === ALL ? undefined : projectId}
        onCreated={(newId) => {
          // Die neue Position soll sofort sichtbar sein, egal wie gefiltert war.
          setSearch(newId);
          setStatus("alle");
          setPhase(ALL);
        }}
      />

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
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Needed</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                    <TableHead className="text-right">Open UGX</TableHead>
                    <TableHead className="text-right">Open EUR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={item.project_item_id}>
                      <TableCell>
                        <p className="font-medium leading-tight">{item.item_name ?? item.project_item_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.project_item_id} · {item.projekt ?? item.project_id}
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
                        No item found.
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
