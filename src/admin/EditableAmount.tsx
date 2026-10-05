import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { parseAmount } from "./format";
import { cn } from "@/lib/utils";

interface EditableAmountProps {
  value: number | null;
  onCommit: (next: number | null) => void;
  label: string;
  placeholder?: string;
  allowEmpty?: boolean;
  /** Breite des Felds, standardmaessig w-28. */
  className?: string;
}

/** Zahl im Feld, gespeichert wird beim Verlassen oder mit Enter — kein Speichern-Knopf je Zeile. */
const EditableAmount = ({ value, onCommit, label, placeholder, allowEmpty = true, className = "w-28" }: EditableAmountProps) => {
  const asText = (input: number | null): string =>
    input === null ? "" : String(input);
  const [draft, setDraft] = useState(() => asText(value));

  useEffect(() => setDraft(asText(value)), [value]);

  const commit = () => {
    const parsed = parseAmount(draft);
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
