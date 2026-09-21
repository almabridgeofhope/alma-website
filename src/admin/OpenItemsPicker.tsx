import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NewProjectItemDialog from "./NewProjectItemDialog";
import { formatQty, formatUgx, parseAmount } from "./format";
import { unitCostUgx, useCreateAssignment, usePhases } from "./queries";
import type { ProjectItem } from "./types";

const ALL = "alle";

interface OpenItemsPickerProps {
  transferId: string;
  items: ProjectItem[];
  assignedItemIds: Set<string>;
}

const OpenItemsPicker = ({ transferId, items, assignedItemIds }: OpenItemsPickerProps) => {
  const phases = usePhases();
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState(ALL);
  const [phase, setPhase] = useState(ALL);
  const [selected, setSelected] = useState<ProjectItem | null>(null);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [newItemId, setNewItemId] = useState<string | null>(null);

  const open = useMemo(() => items.filter((item) => item.qty_open > 0), [items]);

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

  // Eine frisch angelegte Position geht direkt in den Zuordnungsdialog.
  useEffect(() => {
    if (newItemId === null) return;
    const created = items.find((item) => item.project_item_id === newItemId);
    if (created) {
      setSelected(created);
      setNewItemId(null);
    }
  }, [items, newItemId]);

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
    (phases.data ?? []).find((entry) => entry.phase_de === name)?.phase_id;

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
            placeholder="Position suchen"
            aria-label="Offene Positionen durchsuchen"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger aria-label="Nach Projekt filtern">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Alle Projekte</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={phase} onValueChange={setPhase}>
            <SelectTrigger aria-label="Nach Phase filtern">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Alle Phasen</SelectItem>
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
            {visible.length} von {open.length} offen · {formatUgx(openUgx)}
          </p>
          <Button variant="outline" size="sm" onClick={() => setIsNewItemOpen(true)}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Neue Position
          </Button>
        </div>

        <ScrollArea className="h-[26rem] rounded-md border border-border">
          <ul className="divide-y divide-border">
            {visible.map((item) => (
              <li key={item.project_item_id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.item_name ?? item.project_item_id}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.projekt ?? item.project_id} · {item.phase ?? "ohne Phase"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      offen {formatQty(item.qty_open)} · {formatUgx(item.open_ugx)}
                    </p>
                    {assignedItemIds.has(item.project_item_id) && (
                      <Badge variant="secondary" className="mt-1">
                        <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                        bereits zugeordnet
                      </Badge>
                    )}
                  </div>
                  <Plus className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                </button>
              </li>
            ))}

            {visible.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">
                Keine offene Position gefunden.
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
      />

      {selected && (
        <AddAssignmentDialog transferId={transferId} item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
};

interface AddAssignmentDialogProps {
  transferId: string;
  item: ProjectItem;
  onClose: () => void;
}

const AddAssignmentDialog = ({ transferId, item, onClose }: AddAssignmentDialogProps) => {
  const createAssignment = useCreateAssignment(transferId);
  const suggestedAmount = Math.round(item.qty_open * unitCostUgx(item));
  const [qty, setQty] = useState(String(item.qty_open).replace(".", ","));
  const [amount, setAmount] = useState(String(suggestedAmount));
  const [amountTouched, setAmountTouched] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);

  const changeQty = (next: string) => {
    setQty(next);
    if (amountTouched) return;
    const parsed = parseAmount(next);
    setAmount(parsed === null ? "" : String(Math.round(parsed * unitCostUgx(item))));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedQty = parseAmount(qty);
    if (parsedQty === null || parsedQty <= 0) {
      toast.error("Die Menge muss größer als 0 sein.");
      return;
    }
    if (receipt === null) {
      toast.error("Ohne Beleg lässt sich die Position nicht zuordnen.");
      return;
    }

    try {
      await createAssignment.mutateAsync({
        transferId,
        itemId: item.project_item_id,
        qtyPaid: parsedQty,
        amountPaidUgx: parseAmount(amount),
        receipt,
      });
      toast.success(`${item.item_name ?? item.project_item_id} zugeordnet.`);
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
            {item.project_item_id} · offen {formatQty(item.qty_open)} von {formatQty(item.qty_needed)} ·
            Stückpreis {formatUgx(Math.round(unitCostUgx(item)))}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Bezahlte Menge</Label>
              <Input
                id="qty"
                inputMode="decimal"
                autoFocus
                required
                value={qty}
                onChange={(event) => changeQty(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Ist-Betrag in UGX</Label>
              <Input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  setAmountTouched(true);
                  setAmount(event.target.value);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">Beleg</Label>
            <Input
              id="receipt"
              type="file"
              required
              accept="application/pdf,image/*"
              className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
              onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Pflicht: die Quittung aus Uganda, PDF oder Foto. Sie wird der Nachweis dieser Zuordnung.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createAssignment.isPending || receipt === null}>
              {createAssignment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Zuordnen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OpenItemsPicker;
