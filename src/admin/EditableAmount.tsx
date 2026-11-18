import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { pruefeBetrag, type Betragsart } from "./format";
import { cn } from "@/lib/utils";

interface EditableAmountProps {
  value: number | null;
  onCommit: (next: number | null) => void;
  label: string;
  placeholder?: string;
  allowEmpty?: boolean;
  /** Bestimmt, ob Dezimalstellen gelten (UGX: keine). Standard "zahl". */
  art?: Betragsart;
  /** Breite des Felds, standardmaessig w-28. */
  className?: string;
}

/** Zahl im Feld, gespeichert wird beim Verlassen oder mit Enter — kein Speichern-Knopf je Zeile. */
const EditableAmount = ({ value, onCommit, label, placeholder, allowEmpty = true, art = "zahl", className = "w-28" }: EditableAmountProps) => {
  const asText = (input: number | null): string =>
    input === null ? "" : String(input);
  const [draft, setDraft] = useState(() => asText(value));

  useEffect(() => setDraft(asText(value)), [value]);

  const commit = () => {
    // Unverändert (auch ein Wert mit mehr Dezimalstellen, als die Eingabe zulässt): nichts zu tun.
    if (draft === asText(value)) return;
    const ergebnis = pruefeBetrag(draft, art);
    if (!ergebnis.ok) {
      toast.error(ergebnis.message);
      setDraft(asText(value));
      return;
    }
    const parsed = ergebnis.value;
    if (parsed === null && !allowEmpty) {
      setDraft(asText(value));
      return;
    }
    if (parsed !== value) onCommit(parsed);
  };

  return (
    <Input
      aria-label={label}
      inputMode="decimal"
      placeholder={placeholder}
      className={cn("h-9 text-right tabular-nums", className)}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") setDraft(asText(value));
      }}
    />
  );
};

export default EditableAmount;
