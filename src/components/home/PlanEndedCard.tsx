import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pagesLabel } from "@/lib/plan";

interface PlanEndedCardProps {
  endDate: Date;
  /** The page the reader is on. */
  page: number;
  endPage: number;
  percentage: number;
  pagesRemaining: number;
  /** Whether the plan covers the whole Quran ("of the Quran" vs "of your plan"). */
  wholeQuran: boolean;
  onExtend: () => void;
  onNewPlan: () => void;
}

/** Shown in place of the log button once a plan's finish date has passed. */
const PlanEndedCard = ({
  endDate, page, endPage, percentage, pagesRemaining, wholeQuran, onExtend, onNewPlan,
}: PlanEndedCardProps) => (
  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card p-6 text-center">
    <Calendar className="h-8 w-8 text-primary" aria-hidden />
    <p className="text-base font-semibold text-foreground">Your plan ended on {format(endDate, "d MMM")}</p>
    <p className="text-sm text-muted-foreground">
      You reached page {page} of {endPage}. That's {Math.round(percentage)}% of {wholeQuran ? "the Quran" : "your plan"}.{" "}
      {pagesLabel(pagesRemaining)} to go.
    </p>
    <Button className="w-full" onClick={onExtend}>
      Extend finish date
    </Button>
    <Button variant="outline" className="w-full" onClick={onNewPlan}>
      Start a new plan
    </Button>
  </div>
);

export default PlanEndedCard;
