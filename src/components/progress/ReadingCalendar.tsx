import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bestStreak } from "@/lib/plan";
import { monthSquares, type PlanSummary } from "@/lib/progress";
import type { Campaign } from "@/lib/api-types";
import { cn } from "@/lib/utils";

interface ReadingCalendarProps {
  plan: Campaign;
  summary: PlanSummary;
  today: Date;
}

const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();

const daysLabel = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

/** The month as small squares, 14 a row, blue on days with reading, today outlined;
 *  ‹ › go back through the plan's months. Then days read this month and the streaks. */
const ReadingCalendar = ({ plan, summary, today }: ReadingCalendarProps) => {
  const logDates = summary.logs.map((l) => parseISO(l.created_at));
  const planStart = parseISO(plan.start_date);
  const planEnd = parseISO(plan.end_date);
  // From the plan's first month (or its earliest log) to this month, or to the plan's
  // last month once it's over.
  const first = Math.min(monthIndex(planStart), ...logDates.map(monthIndex));
  const last = summary.expired ? monthIndex(planEnd) : monthIndex(today);
  const [shown, setShown] = useState(last);

  const year = Math.floor(shown / 12);
  const month = shown % 12;
  const squares = monthSquares({ year, month, logDates, today, planStart, planEnd });
  const readThisMonth = squares.filter((s) => s.read).length;
  const label = format(new Date(year, month, 1), "MMMM yyyy");

  return (
    <section aria-labelledby="reading-days" className="rounded-2xl bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 id="reading-days" className="text-heading font-semibold text-foreground">
          {label}
        </h2>
        <div className="-mr-2 flex">
          <Button variant="ghost" size="icon" onClick={() => setShown(shown - 1)} disabled={shown <= first} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShown(shown + 1)} disabled={shown >= last} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ol className="mt-3 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-[3px]" aria-label={`Days read in ${label}`}>
        {squares.map((s) => (
          <li
            key={s.day}
            aria-label={`${format(s.date, "d MMMM")}${s.read ? ", read" : ""}${s.isToday ? ", today" : ""}`}
            className={cn(
              "flex aspect-square items-center justify-center rounded-[5px] text-[11px] font-medium leading-none tabular-nums",
              s.read ? "bg-primary text-primary-foreground" : "bg-subtle text-muted-foreground",
              !s.read && s.faint && "opacity-50",
              s.isToday && !s.read && "ring-[1.5px] ring-inset ring-primary text-primary",
              s.isToday && s.read && "ring-2 ring-accent-soft",
            )}
          >
            {s.day}
          </li>
        ))}
      </ol>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["This month", daysLabel(readThisMonth)],
          ["Current streak", daysLabel(summary.streak)],
          ["Best streak", daysLabel(bestStreak(logDates))],
        ].map(([term, value]) => (
          <div key={term}>
            <dt className="text-caption text-muted-foreground">{term}</dt>
            <dd className="text-heading font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      {summary.logs.length === 0 && (
        <p className="mt-3 text-small text-muted-foreground">Days you read turn blue.</p>
      )}
    </section>
  );
};

export default ReadingCalendar;
