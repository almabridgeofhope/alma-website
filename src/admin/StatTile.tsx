import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "positive";
}

const TONE_CLASSES: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-secondary-foreground",
  positive: "text-primary",
};

const StatTile = ({ label, value, hint, tone = "default" }: StatTileProps) => (
  <div className="rounded-lg border border-border bg-card p-4 shadow-card">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className={cn("mt-1 text-2xl font-semibold tabular-nums", TONE_CLASSES[tone])}>{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export default StatTile;
