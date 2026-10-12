// Reading plan maths shared by onboarding and the home screen.
import { addDays, addYears, differenceInCalendarDays, startOfDay } from "date-fns";
import { SURAHS, TOTAL_PAGES, getEndPageForSurah, getStartPageForSurah } from "@/lib/quran-data";

/** Calendar days from `from` to `to`, counting both ends (minimum 1). */
export function daysInclusive(from: Date, to: Date): number {
  return Math.max(1, differenceInCalendarDays(to, from) + 1);
}

/** Pages a day needed to finish `pagesRemaining` in `daysRemaining` days. */
export function dailyPace(pagesRemaining: number, daysRemaining: number): number {
  return Math.ceil(Math.max(0, pagesRemaining) / Math.max(1, daysRemaining));
}

/** Rough pages after each of the five daily prayers (at least 1 while there's reading to do). */
export function pagesPerPrayer(pagesPerDay: number): number {
  return pagesPerDay > 0 ? Math.max(1, Math.round(pagesPerDay / 5)) : 0;
}

/** Finish date for an "N days" plan: today counts as day 1. */
export function finishAfterDays(today: Date, days: number): Date {
  return addDays(startOfDay(today), days - 1);
}

/** Finish date for an "N years" plan: the day before the same date N years on. */
export function finishAfterYears(today: Date, years: number): Date {
  return addDays(addYears(startOfDay(today), years), -1);
}

export type GoalType = "full" | "juzAmma" | "range";

export const GOAL_LABELS: Record<GoalType, string> = {
  full: "Full Quran (khatam)",
  juzAmma: "Juz Amma (Juz 30)",
  range: "Choose a range",
};

/** Juz Amma runs from the start of An-Naba (surah 78) to the end of the Quran. */
export const JUZ_AMMA_START_PAGE = getStartPageForSurah("78");

/** First and last page of a goal. For a range, surahs are numbers as strings. */
export function goalPages(goal: GoalType, startSurah: string, endSurah: string): { start: number; end: number } {
  if (goal === "full") return { start: 1, end: TOTAL_PAGES };
  if (goal === "juzAmma") return { start: JUZ_AMMA_START_PAGE, end: TOTAL_PAGES };
  return { start: getStartPageForSurah(startSurah), end: getEndPageForSurah(endSurah) };
}

const surahName = (n: string) => SURAHS.find((s) => String(s.number) === n)?.name ?? "";

/** Name stored on the reading plan. */
export function goalTitle(goal: GoalType, startSurah: string, endSurah: string): string {
  if (goal !== "range") return GOAL_LABELS[goal];
  return startSurah === endSurah
    ? surahName(startSurah)
    : `${surahName(startSurah)} – ${surahName(endSurah)}`;
}

/** Pages left to read when starting a plan on `startPage` (the page you're on still counts). */
export function pagesToGo(startPage: number, endPage: number): number {
  return Math.max(0, endPage - startPage + 1);
}

/** "1 page" / "5 pages" */
export function pagesLabel(n: number): string {
  return `${n} ${n === 1 ? "page" : "pages"}`;
}
