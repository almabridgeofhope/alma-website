import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEur, formatUgx, parseAmount } from "./format";
import { useCreateProjectItem, useEurRate, usePhases, useProjects } from "./queries";

interface NewProjectItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Vorauswahl aus den aktiven Filtern. */
  defaultProjectId?: string;
  defaultPhaseId?: string;
  onCreated: (projectItemId: string) => void;
}

const NewProjectItemDialog = ({
  open,
  onOpenChange,
  defaultProjectId,
  defaultPhaseId,
  onCreated,
}: NewProjectItemDialogProps) => {
  const projects = useProjects();
  const phases = usePhases();
  const rate = useEurRate();
  const createItem = useCreateProjectItem();

  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [phaseId, setPhaseId] = useState(defaultPhaseId ?? "");
  const [titleDe, setTitleDe] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState("");

  const parsedQty = parseAmount(qty);
  const parsedCost = parseAmount(unitCost);
  const total = parsedQty !== null && parsedCost !== null ? parsedQty * parsedCost : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (projectId === "" || phaseId === "") {
      toast.error("Bitte Projekt und Phase wählen.");
      return;
    }
    if (parsedQty === null || parsedQty <= 0 || parsedCost === null || parsedCost < 0) {
      toast.error("Menge und Stückpreis müssen Zahlen sein, die Menge größer als 0.");
      return;
    }

    try {
      const newId = await createItem.mutateAsync({
        projectId,
        phaseId,
        titleDe,
        titleEn: titleEn.trim() === "" ? null : titleEn.trim(),
        qtyNeeded: parsedQty,
        unitCostUgx: parsedCost,
      });
      toast.success(`Position ${newId} angelegt.`);
      setTitleDe("");
      setTitleEn("");
      setQty("1");
      setUnitCost("");
      onOpenChange(false);
      onCreated(newId);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Neue Position</DialogTitle>
          <DialogDescription>
            Für Ausgaben, die im Plan fehlen. Die ID vergibt die Datenbank nach dem Kürzel der Phase.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-project">Projekt</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="new-project">
                  <SelectValue placeholder="wählen" />
                </SelectTrigger>
                <SelectContent>
                  {(projects.data ?? []).map((project) => (
                    <SelectItem key={project.project_id} value={project.project_id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-phase">Phase</Label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger id="new-phase">
                  <SelectValue placeholder="wählen" />
                </SelectTrigger>
                <SelectContent>
                  {(phases.data ?? []).map((phase) => (
                    <SelectItem key={phase.phase_id} value={phase.phase_id}>
                      {phase.phase_de ?? phase.phase_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-title-de">Bezeichnung</Label>
            <Input
              id="new-title-de"
              required
              value={titleDe}
              onChange={(event) => setTitleDe(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-title-en">
              Bezeichnung englisch <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="new-title-en"
              placeholder="leer = wie oben"
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-qty">Menge</Label>
              <Input
                id="new-qty"
                inputMode="decimal"
                required
                value={qty}
                onChange={(event) => setQty(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-cost">Stückpreis in UGX</Label>
              <Input
                id="new-cost"
                inputMode="decimal"
                required
                placeholder="250.000"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
              />
            </div>
          </div>

          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Gesamt:{" "}
            <span className="tabular-nums text-foreground">
              {total === null ? "–" : formatUgx(total)}
            </span>
            {total !== null && rate.data ? (
              <span className="tabular-nums"> · {formatEur(total / rate.data)}</span>
            ) : null}
          </p>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createItem.isPending}>
              {createItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Anlegen und zuordnen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectItemDialog;
