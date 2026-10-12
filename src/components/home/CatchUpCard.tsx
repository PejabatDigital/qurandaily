import { format } from "date-fns";
import { Plus, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CatchUpCardProps {
  pagesBehind: number;
  dailyTarget: number;
  endDate: Date;
  onLog: () => void;
  onDismiss: () => void;
}

/** Calm nudge when the reader is behind schedule. Never red, never guilt. */
const CatchUpCard = ({ pagesBehind, dailyTarget, endDate, onLog, onDismiss }: CatchUpCardProps) => (
  <div className="relative flex items-start gap-3 rounded-lg border border-primary bg-primary/10 p-4">
    <TrendingUp className="h-5 w-5 shrink-0 text-primary" aria-hidden />
    <div className="flex min-w-0 flex-1 flex-col items-start gap-2 pr-6">
      <p className="text-sm font-semibold text-foreground">
        Welcome back. You're {pagesBehind} {pagesBehind === 1 ? "page" : "pages"} behind.
      </p>
      <p className="text-xs text-foreground">
        No pressure: {dailyTarget} {dailyTarget === 1 ? "page" : "pages"} a day still gets you there by{" "}
        {format(endDate, "d MMM")}.
      </p>
      <Button size="sm" onClick={onLog}>
        <Plus /> Log reading
      </Button>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
      onClick={onDismiss}
      aria-label="Dismiss for today"
    >
      <X />
    </Button>
  </div>
);

export default CatchUpCard;
