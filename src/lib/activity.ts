// Reading Activity graph: pages read on each day of a reading plan.
import { addDays, differenceInCalendarDays, format, max, min, parseISO, startOfDay } from "date-fns";

export interface ActivityDay {
  date: Date;
  pages: number;
}

/**
 * One entry per calendar day of the plan, from its start date to the last day
 * worth showing: today while the plan is running, or the day it was finished
 * or its end date once it's over, so a past plan keeps its own graph instead
 * of sliding into empty days. Logs dated before the start date (after editing
 * it) pull the start back so they still show.
 */
export function planActivity(opts: {
  startDate: Date;
  endDate: Date;
  today: Date;
  finishedOn: Date | null;
  logs: { created_at: string; pages_read: number }[];
}): ActivityDay[] {
  const logDates = opts.logs.map((l) => parseISO(l.created_at));
  const first = startOfDay(min([opts.startDate, ...logDates]));
  const last = startOfDay(max([first, min([opts.today, opts.endDate, ...(opts.finishedOn ? [opts.finishedOn] : [])])]));

  const pagesByDay = new Map<string, number>();
  opts.logs.forEach((l, i) => {
    const key = format(logDates[i], "yyyy-MM-dd");
    pagesByDay.set(key, (pagesByDay.get(key) ?? 0) + l.pages_read);
  });

  return Array.from({ length: differenceInCalendarDays(last, first) + 1 }, (_, i) => {
    const date = addDays(first, i);
    return { date, pages: pagesByDay.get(format(date, "yyyy-MM-dd")) ?? 0 };
  });
}
