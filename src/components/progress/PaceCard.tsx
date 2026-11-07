import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Campaign } from "@/lib/api-types";
import { pace, projectedFinish, type PlanSummary } from "@/lib/progress";
import { pagesLabel } from "@/lib/plan";

interface PaceCardProps {
  plan: Campaign;
  summary: PlanSummary;
  today: Date;
}

/** Will the reader finish on time? Ahead or behind an even schedule, how far through
 *  the plan they are, and the finish date at their average pace so far. */
const PaceCard = ({ plan, summary, today }: PaceCardProps) => {
  const startDate = parseISO(plan.start_date);
  const endDate = parseISO(plan.end_date);
  const { totalPages, pagesRead, pagesReadToday, percentage, expired, finishedOn } = summary;
  const left = Math.max(0, totalPages - pagesRead);
  const endLabel = format(endDate, "d MMM");

  let headline: string;
  let note: string;
  if (finishedOn) {
    headline = "Plan complete";
    note = `Finished on ${format(finishedOn, "EEE d MMM")}.`;
  } else if (expired) {
    headline = "Plan ended";
    note = `It ended on ${endLabel} with ${pagesLabel(left)} to go.`;
  } else if (pagesRead === 0) {
    headline = "Not started yet";
    note = "Log your first reading to see your pace.";
  } else {
    // Both measured from the plan's first day, or its earliest reading if that came
    // first (as the chart does), so readings logged before an edited start date count.
    const readingStart = summary.activity[0]?.date ?? startDate;
    const p = pace({ totalPages, pagesRead, startDate: readingStart, endDate, today });
    headline = p.kind === "onTrack" ? "On track" : `${pagesLabel(p.pages)} ${p.kind}`;
    const finish = projectedFinish({ totalPages, pagesRead, pagesReadToday, startDate: readingStart, today });
    if (finish) {
      const late = differenceInCalendarDays(finish, endDate);
      const when = late === 0 ? "on your end date" : late < 0 ? `before your ${endLabel} end date` : `after your ${endLabel} end date`;
      note = `At your pace, you'll finish on ${format(finish, "EEE d MMM")}, ${when}.`;
    } else {
      note = "";
    }
  }

  const shown = Math.min(100, Math.floor(percentage));

  return (
    <section aria-labelledby="pace" className="rounded-2xl bg-card p-5">
      <p className="text-small text-muted-foreground">
        {plan.title} · {expired ? "ended" : "ends"} {endLabel}
      </p>
      <h2 id="pace" className="mt-1 text-title font-semibold text-foreground">
        {headline}
      </h2>
      <div
        role="progressbar"
        aria-label="Plan progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown}
        className="mt-4 h-2 overflow-hidden rounded-full bg-subtle"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${shown}%` }} />
      </div>
      <p className="mt-2 text-small text-muted-foreground">
        {shown}% · {pagesRead} of {pagesLabel(totalPages)}
      </p>
      {note && <p className="mt-3 text-body text-foreground">{note}</p>}
    </section>
  );
};

export default PaceCard;
