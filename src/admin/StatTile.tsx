import type { ReactNode } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "positive";
  /** Erscheint beim Hover ueber den Wert. */
  details?: ReactNode;
}

const TONE_CLASSES: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-secondary-foreground",
  positive: "text-primary",
};

const StatTile = ({ label, value, hint, tone = "default", details }: StatTileProps) => {
  const wert = <p className={cn("mt-1 text-2xl font-semibold tabular-nums", TONE_CLASSES[tone])}>{value}</p>;
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      {details ? (
        <HoverCard openDelay={100} closeDelay={100}>
          <HoverCardTrigger asChild>
            <button type="button" className="cursor-help text-left underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">
              {wert}
            </button>
          </HoverCardTrigger>
          <HoverCardContent align="start" className="w-80">
            {details}
          </HoverCardContent>
        </HoverCard>
      ) : (
        wert
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};

export default StatTile;
