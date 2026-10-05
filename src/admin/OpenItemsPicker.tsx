import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NewProjectItemDialog from "./NewProjectItemDialog";
import { formatQty, formatUgx } from "./format";
import { phaseLabel, usePhases } from "./queries";
import type { ProjectItem } from "./types";

const ALL = "alle";

interface OpenItemsPickerProps {
  items: ProjectItem[];
  /** Was mit der gewaehlten Position geschieht, entscheidet die Seite: zuordnen oder vormerken. */
  onPick: (item: ProjectItem) => void;
  /** Positionen, die hier schon stehen — sie bleiben waehlbar, sind aber markiert. */
  markedItemIds: Set<string>;
  markedLabel: string;
  /** Verplante Menge je Position in anderen geplanten Transfers. */
  plannedQty?: Map<string, number>;
  /**
   * Beim Planen: nur anbieten, was noch nicht verplant ist, und keine laufenden Kosten —
   * die stehen in den geplanten Kosten und zaehlten sonst doppelt.
   */
  forPlanning?: boolean;
  newItemLabel: string;
}

const OpenItemsPicker = ({
  items,
  onPick,
  markedItemIds,
  markedLabel,
  plannedQty,
  forPlanning = false,
  newItemLabel,
}: OpenItemsPickerProps) => {
  const phases = usePhases();
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState(ALL);
  const [phase, setPhase] = useState(ALL);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [newItemId, setNewItemId] = useState<string | null>(null);

  const planned = (item: ProjectItem): number => plannedQty?.get(item.project_item_id) ?? 0;

  const open = useMemo(
    () =>
      items.filter((item) =>
        forPlanning
          ? item.projekt_status !== "laufend" && item.qty_open - (plannedQty?.get(item.project_item_id) ?? 0) > 0
          : item.qty_open > 0,
      ),
    [items, forPlanning, plannedQty],
  );

  const projects = useMemo(() => {
    const byId = new Map<string, string>();
    items.forEach((item) => byId.set(item.project_id, item.projekt ?? item.project_id));
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // Nur Phasen anbieten, in denen das gewählte Projekt überhaupt etwas offen hat.
  const phaseOptions = useMemo(() => {
    const names = open
      .filter((item) => projectId === ALL || item.project_id === projectId)
      .map((item) => item.phase)
      .filter((value): value is string => !!value);
    return Array.from(new Set(names)).sort();
  }, [open, projectId]);

  useEffect(() => {
    if (phase !== ALL && !phaseOptions.includes(phase)) setPhase(ALL);
  }, [phaseOptions, phase]);

  // Eine frisch angelegte Position geht direkt weiter, wie eine gewaehlte.
  useEffect(() => {
    if (newItemId === null) return;
    const created = items.find((item) => item.project_item_id === newItemId);
    if (created) {
      onPick(created);
      setNewItemId(null);
    }
  }, [items, newItemId, onPick]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return open
      .filter((item) => projectId === ALL || item.project_id === projectId)
      .filter((item) => phase === ALL || item.phase === phase)
      .filter(
        (item) =>
          needle === "" ||
          (item.item_name ?? "").toLowerCase().includes(needle) ||
          item.project_item_id.toLowerCase().includes(needle),
      );
  }, [open, projectId, phase, search]);

  const openUgx = visible.reduce((sum, item) => sum + item.open_ugx, 0);

  const phaseIdOfName = (name: string): string | undefined =>
    (phases.data ?? []).find((entry) => phaseLabel(entry) === name)?.phase_id;

  return (
    <>
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder="Search item or ID"
            aria-label="Search open items by name or ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger aria-label="Filter by project">
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
            <SelectTrigger aria-label="Filter by phase">
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
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {visible.length} of {open.length} open · {formatUgx(openUgx)}
          </p>
          <Button variant="outline" size="sm" onClick={() => setIsNewItemOpen(true)}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            New item
          </Button>
        </div>

        <ScrollArea className="h-[26rem] rounded-md border border-border">
          <ul className="divide-y divide-border">
            {visible.map((item) => (
              <li key={item.project_item_id}>
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.item_name ?? item.project_item_id}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.project_item_id} · {item.projekt ?? item.project_id} ·{" "}
                      {item.phase ?? "no phase"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      open {formatQty(item.qty_open)} · {formatUgx(item.open_ugx)}
                      {planned(item) > 0 && ` · ${formatQty(planned(item))} planned`}
                    </p>
                    {markedItemIds.has(item.project_item_id) && (
                      <Badge variant="secondary" className="mt-1">
                        <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                        {markedLabel}
                      </Badge>
                    )}
                  </div>
                  <Plus className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                </button>
              </li>
            ))}

            {visible.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                No open item found.
              </li>
            )}
          </ul>
        </ScrollArea>
      </div>

      <NewProjectItemDialog
        open={isNewItemOpen}
        onOpenChange={setIsNewItemOpen}
        defaultProjectId={projectId === ALL ? undefined : projectId}
        defaultPhaseId={phase === ALL ? undefined : phaseIdOfName(phase)}
        onCreated={setNewItemId}
        submitLabel={newItemLabel}
      />
    </>
  );
};

export default OpenItemsPicker;
