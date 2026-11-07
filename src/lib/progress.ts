// Maths for the Progress page (pages/Progress.tsx), shared with Home where they overlap.
import { addDays, differenceInCalendarDays, endOfDay, format, parseISO, startOfDay, subDays } from "date-fns";
import { daysInclusive } from "@/lib/plan";
import { planActivity, type ActivityDay } from "@/lib/activity";
import type { Campaign, ReadingLog } from "@/lib/api-types";

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

/** Days in a row with a log, counting back from `endDate` (today, or the plan's end
 *  date once it's over). Zero when `endDate` itself has no log yet. */
export function currentStreak(logDates: Date[], endDate: Date): number {
  const days = new Set(logDates.map(dayKey));
  let streak = 0;
  for (let d = endDate; days.has(dayKey(d)); d = subDays(d, 1)) streak++;
  return streak;
}

/** What Home and Progress both need to know about a reading plan. */
export interface PlanSummary {
  /** The plan's logs up to its end date, newest first (as the API returns them). */
  logs: ReadingLog[];
  totalPages: number;
  pagesRead: number;
  pagesReadToday: number;
  percentage: number;
  /** Its end date has passed. */
  expired: boolean;
  /** The day its last page was read, once it's complete. */
  finishedOn: Date | null;
  streak: number;
  activity: ActivityDay[];
}

export function planSummary(plan: Campaign, allLogs: ReadingLog[], now: Date): PlanSummary {
  const endDate = endOfDay(parseISO(plan.end_date));
  const expired = endDate < now;
  const logs = allLogs.filter((l) => l.campaign_id === plan.id && parseISO(l.created_at) <= endDate);
  const logDates = logs.map((l) => parseISO(l.created_at));
  const totalPages = plan.end_page - plan.start_page + 1;
  const pagesRead = logs.reduce((sum, l) => sum + l.pages_read, 0);
  const pagesReadToday = logs.filter((_, i) => dayKey(logDates[i]) === dayKey(now)).reduce((sum, l) => sum + l.pages_read, 0);
  const finishedOn = pagesRead >= totalPages && logDates[0] ? logDates[0] : null;
  return {
    logs,
    totalPages,
    pagesRead,
    pagesReadToday,
    percentage: totalPages > 0 ? (pagesRead / totalPages) * 100 : 0,
    expired,
    finishedOn,
    streak: logs.length ? currentStreak(logDates, expired ? endDate : now) : 0,
    activity: planActivity({ startDate: parseISO(plan.start_date), endDate, today: now, finishedOn, logs }),
  };
}

/** Expected pages by the end of `throughDay`, spreading the plan evenly over its days. */
function expectedBy(totalPages: number, startDate: Date, endDate: Date, throughDay: Date): number {
  const totalDays = daysInclusive(startDate, endDate);
  const days = Math.min(totalDays, Math.max(0, differenceInCalendarDays(throughDay, startDate) + 1));
  return (totalPages * days) / totalDays;
}

export type Pace = { kind: "ahead" | "behind"; pages: number } | { kind: "onTrack" };

/**
 * Where the reader stands against an even schedule. Behind only when short of where
 * they should have been by the end of yesterday (as Home's catch-up card); ahead only
 * once past where they should be by the end of today. In between, today's reading can
 * still keep them on track, so it says so.
 */
export function pace(opts: { totalPages: number; pagesRead: number; startDate: Date; endDate: Date; today: Date }): Pace {
  const { totalPages, pagesRead, startDate, endDate, today } = opts;
  const behind = Math.round(expectedBy(totalPages, startDate, endDate, subDays(today, 1)) - pagesRead);
  if (behind >= 1) return { kind: "behind", pages: behind };
  const ahead = Math.round(pagesRead - expectedBy(totalPages, startDate, endDate, today));
  if (ahead >= 1) return { kind: "ahead", pages: ahead };
  return { kind: "onTrack" };
}

/**
 * The day the plan would finish at the reader's average pace since it started (today
 * counts once something is logged today). Null before any reading, or once complete.
 */
export function projectedFinish(opts: {
  totalPages: number;
  pagesRead: number;
  pagesReadToday: number;
  startDate: Date;
  today: Date;
}): Date | null {
  const { totalPages, pagesRead, pagesReadToday, startDate, today } = opts;
  const left = totalPages - pagesRead;
  if (pagesRead <= 0 || left <= 0) return null;
  const readThrough = pagesReadToday > 0 ? today : subDays(today, 1);
  const days = Math.max(1, differenceInCalendarDays(readThrough, startDate) + 1);
  const perDay = pagesRead / days;
  const firstDay = pagesReadToday > 0 ? addDays(today, 1) : today;
  return startOfDay(addDays(firstDay, Math.ceil(left / perDay) - 1));
}

export interface DaySquare {
  day: number;
  date: Date;
  read: boolean;
  isToday: boolean;
  /** After today, or outside the plan's dates: shown faint. */
  faint: boolean;
}

/** One square per day of a month (`month` 0-11) for the reading calendar. */
export function monthSquares(opts: {
  year: number;
  month: number;
  logDates: Date[];
  today: Date;
  planStart: Date;
  planEnd: Date;
}): DaySquare[] {
  const read = new Set(opts.logDates.map(dayKey));
  const count = new Date(opts.year, opts.month + 1, 0).getDate();
  const first = dayKey(opts.planStart);
  const last = dayKey(opts.planEnd);
  const today = dayKey(opts.today);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(opts.year, opts.month, i + 1);
    const key = dayKey(date);
    return {
      day: i + 1,
      date,
      read: read.has(key),
      isToday: key === today,
      faint: key > today || key < first || key > last,
    };
  });
}
