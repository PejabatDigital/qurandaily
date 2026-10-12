import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TodayReadingCardProps {
  pagesToday: number;
  dailyTarget: number;
  onLog: () => void;
}

/** "Today's reading" prompt shown until the first reading is logged on a plan. */
const TodayReadingCard = ({ pagesToday, dailyTarget, onLog }: TodayReadingCardProps) => {
  const progress = dailyTarget > 0 ? Math.min(100, (pagesToday / dailyTarget) * 100) : 0;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3 text-sm">
        <p className="font-semibold text-foreground">Today's reading</p>
        <p className="text-muted-foreground">
          {pagesToday} of {dailyTarget} {dailyTarget === 1 ? "page" : "pages"}
        </p>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Today's reading"
        aria-valuemin={0}
        aria-valuemax={dailyTarget}
        aria-valuenow={pagesToday}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">Bismillah. Log what you read today and your streak starts.</p>
      <Button className="w-full" onClick={onLog}>
        <Plus /> Log your first reading
      </Button>
    </Card>
  );
};

export default TodayReadingCard;
