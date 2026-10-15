import { useMemo, useState } from "react";
import { AlertTriangle, Check, Circle, CircleDashed, Loader2, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatUgx } from "./format";
import { usePlannedTransfers } from "./planQueries";
import { useProjectItems } from "./queries";
import {
  dieserMonat,
  naechsterMonat,
  paketImMonat,
  useAllowanceEinplanen,
  useAllowanceMonate,
  useAllowancePaket,
  useAllowancePaketSpeichern,
  type AllowanceMonat,
  type Monat,
  type MonatsStatus,
} from "./allowanceQueries";

const ANZAHL_MONATE = 4;
const PROJEKT_OTHER = "PROJ-004";

const STATUS: Record<MonatsStatus, { label: string; icon: typeof Circle; klasse: string }> = {
  bezahlt: { label: "paid", icon: Check, klasse: "text-primary" },
  gesendet: { label: "sent", icon: Send, klasse: "text-primary" },
  geplant: { label: "planned", icon: CircleDashed, klasse: "text-muted-foreground" },
  teilweise: { label: "incomplete", icon: AlertTriangle, klasse: "bg-secondary/40 text-secondary-foreground" },
  offen: { label: "open", icon: Circle, klasse: "text-muted-foreground/70" },
  ueberfaellig: { label: "overdue", icon: AlertTriangle, klasse: "bg-destructive/10 text-destructive" },
};

const monatsformat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const kurzformat = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const monatsName = (monat: Monat) => monatsformat.format(new Date(`${monat}T00:00:00Z`));
const kurzMonat = (monat: Monat) => kurzformat.format(new Date(`${monat}T00:00:00Z`));

const MonatsChip = ({ monat }: { monat: AllowanceMonat }) => {
  const plans = usePlannedTransfers();
  const einplanen = useAllowanceEinplanen();
  const { label, icon: Icon, klasse } = STATUS[monat.status];

  // Gezahlt wird im Vormonat: nur offene, noch nicht gesendete Plaene dieses Monats kommen infrage.
  const sendemonat = naechsterMonat(monat.monat, -1);
  const kandidaten = (plans.data ?? []).filter(
    (plan) => plan.status === "geplant" && !plan.gesendet_referenz && plan.geplant_fuer === sendemonat,
  );
  const vorhanden = kandidaten.find((plan) => monat.zeilen.some((zeile) => zeile.quelle?.includes(plan.plan_transfer_id)));
  const ziel = vorhanden ?? kandidaten[0] ?? null;

  return (
    <Popover onOpenChange={() => einplanen.reset()}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium hover:bg-accent", klasse)}
          aria-label={`${monatsName(monat.monat)}: ${label}`}
        >
          {kurzMonat(monat.monat)}
          <Icon className="h-3 w-3" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3 text-sm">
        <p className="mb-2 font-medium">
          {monatsName(monat.monat)} <span className="font-normal text-muted-foreground">· {label}</span>
        </p>
        <ul className="space-y-1">
          {monat.zeilen.map((zeile) => {
            const fehlt = zeile.status === "fehlt" || zeile.status === "teilweise";
            return (
              <li key={zeile.item_id} className="flex justify-between gap-3">
                <span className={cn("truncate", fehlt && "text-destructive")} title={zeile.item_id}>
                  {zeile.menge !== 1 && `${zeile.menge} × `}
                  {zeile.item_name ?? zeile.item_id}
                </span>
                <span className={cn("shrink-0 text-xs", fehlt ? "text-destructive" : "text-muted-foreground")}>
                  {zeile.status === "fehlt" ? "missing" : zeile.status === "teilweise" ? `${zeile.quelle} · short` : zeile.quelle}
                </span>
              </li>
            );
          })}
        </ul>
        {monat.fehlend > 0 && (
          <Button
            size="sm"
            className="mt-3 w-full"
            disabled={einplanen.isPending || plans.isPending}
            onClick={() => einplanen.mutate({ monat: monat.monat, planId: ziel?.plan_transfer_id ?? null })}
          >
            {einplanen.isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            )}
            {monat.fehlend === monat.zeilen.length ? "Plan allowance" : "Add missing"}
            {ziel ? ` to ${ziel.plan_transfer_id}` : " as new transfer"}
          </Button>
        )}
        {einplanen.isError && <p className="mt-2 text-xs text-destructive">{einplanen.error.message}</p>}
      </PopoverContent>
    </Popover>
  );
};

const PaketDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const paket = useAllowancePaket();
  const items = useProjectItems();
  const speichern = useAllowancePaketSpeichern();
  const [ab, setAb] = useState<Monat>(naechsterMonat(dieserMonat(), 2));
  const [mengen, setMengen] = useState<Record<string, string>>({});

  const aktuell = paketImMonat(paket.data ?? [], ab);
  // Alle laufenden Positionen (Other): so laesst sich auch eine neue Zeile aufnehmen.
  const zeilen = (items.data ?? []).filter(
    (item) => item.project_id === PROJEKT_OTHER || aktuell.has(item.project_item_id),
  );
  const wert = (itemId: string) => mengen[itemId] ?? String(aktuell.get(itemId) ?? 0);

  const schliessen = (offen: boolean) => {
    if (!offen) {
      setMengen({});
      speichern.reset();
    }
    onOpenChange(offen);
  };

  const sichern = () => {
    const geaendert = zeilen
      .filter((item) => Number(wert(item.project_item_id)) !== (aktuell.get(item.project_item_id) ?? 0))
      .map((item) => ({ item_id: item.project_item_id, gueltig_ab: ab, menge: Number(wert(item.project_item_id)) }));
    speichern.mutate(geaendert, { onSuccess: () => schliessen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={schliessen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Monthly allowance</DialogTitle>
          <DialogDescription>
            Quantity per month, paid one month ahead. 0 stops a line. Months already paid stay as they were.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">From</span>
            <Select
              value={ab}
              onValueChange={(monat) => {
                setAb(monat);
                setMengen({});
              }}
            >
              <SelectTrigger className="h-8 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, i) => naechsterMonat(dieserMonat(), i + 1)).map((monat) => (
                  <SelectItem key={monat} value={monat}>
                    {monatsName(monat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {zeilen.map((item) => {
            const stueck = item.qty_needed ? (item.total_ugx ?? 0) / item.qty_needed : null;
            return (
              <div key={item.project_item_id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate">{item.item_name ?? item.project_item_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.project_item_id}
                    {stueck !== null && <> · {formatUgx(stueck)} each</>}
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  className="h-8 w-16 text-right"
                  value={wert(item.project_item_id)}
                  onChange={(e) => setMengen((m) => ({ ...m, [item.project_item_id]: e.target.value }))}
                  aria-label={`Quantity per month for ${item.item_name ?? item.project_item_id}`}
                />
              </div>
            );
          })}
          {speichern.isError && <p className="text-xs text-destructive">{speichern.error.message}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => schliessen(false)}>
            Cancel
          </Button>
          <Button onClick={sichern} disabled={speichern.isPending || paket.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Eine Zeile unter "Planned transfers": je Monat, ob die Allowance ans Team in einem
 * Transfer steckt. Gezahlt wird einen Monat im Voraus (v_allowance_monate).
 */
const AllowanceLeiste = () => {
  const monate = useAllowanceMonate();
  const [dialog, setDialog] = useState(false);

  // Ab dem laufenden Monat, dazu jeder fruehere, der nicht bezahlt ist.
  const sichtbar = useMemo(() => {
    const jetzt = dieserMonat();
    const alle = monate.data ?? [];
    const rueckstand = alle.filter((m) => m.monat < jetzt && m.status !== "bezahlt");
    return [...rueckstand, ...alle.filter((m) => m.monat >= jetzt).slice(0, ANZAHL_MONATE)];
  }, [monate.data]);

  if (monate.isError || (monate.isSuccess && sichtbar.length === 0)) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <button type="button" onClick={() => setDialog(true)} className="mr-1 hover:text-foreground hover:underline">
        Allowance
      </button>
      {sichtbar.map((monat) => (
        <MonatsChip key={monat.monat} monat={monat} />
      ))}
      <PaketDialog open={dialog} onOpenChange={setDialog} />
    </div>
  );
};

export default AllowanceLeiste;
