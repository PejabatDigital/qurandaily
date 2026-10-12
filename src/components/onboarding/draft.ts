import { format, parseISO, startOfDay } from "date-fns";
import {
  dailyPace, daysInclusive, finishAfterDays, finishAfterYears, goalPages, goalTitle, pagesToGo,
  type GoalType,
} from "@/lib/plan";

export type FinishPreset = "30" | "60" | "ramadan" | "year" | "date";

/** Everything the user has chosen so far. Kept while they move between steps. */
export type PlanDraft = {
  goal: GoalType;
  /** Surah numbers as strings, for "Choose a range". */
  startSurah: string;
  endSurah: string;
  finish: FinishPreset;
  /** yyyy-MM-dd, for "Pick a date". */
  pickedDate: string;
  startFrom: "beginning" | "current";
  currentPage: string;
  name: string;
  /** "Skip for now" on the personal step: don't save the name. */
  personalSkipped: boolean;
};

export const INITIAL_DRAFT: PlanDraft = {
  goal: "full",
  startSurah: "1",
  endSurah: "114",
  finish: "30",
  pickedDate: "",
  startFrom: "beginning",
  currentPage: "",
  name: "",
  personalSkipped: false,
};

export type DerivedPlan = {
  title: string;
  goalStart: number;
  goalEnd: number;
  /** Page the plan starts on: the goal's first page, or the page they're on. */
  startPage: number;
  finishDate: Date | null;
  pagesRemaining: number;
  /** Pages a day to finish on time, or null without a valid finish date. */
  perDay: number | null;
  rangeError: string | null;
  dateError: string | null;
  pageError: string | null;
};

export const toDateInput = (d: Date) => format(d, "yyyy-MM-dd");

function finishDateFor(draft: PlanDraft, today: Date, ramadanEnd: Date | null): Date | null {
  switch (draft.finish) {
    case "30": return finishAfterDays(today, 30);
    case "60": return finishAfterDays(today, 60);
    case "year": return finishAfterYears(today, 1);
    case "ramadan": return ramadanEnd;
    case "date": {
      if (!draft.pickedDate) return null;
      const picked = parseISO(draft.pickedDate);
      return isNaN(picked.getTime()) || picked < startOfDay(today) ? null : picked;
    }
  }
}

/** Pages a day for a given finish date, from the plan's starting page. */
export function paceUntil(startPage: number, goalEnd: number, today: Date, finish: Date): number {
  return dailyPace(pagesToGo(startPage, goalEnd), daysInclusive(today, finish));
}

export function derivePlan(draft: PlanDraft, today: Date, ramadanEnd: Date | null): DerivedPlan {
  const { start: goalStart, end: goalEnd } = goalPages(draft.goal, draft.startSurah, draft.endSurah);

  const rangeError =
    draft.goal === "range" && Number(draft.endSurah) < Number(draft.startSurah)
      ? "The end surah must come after the start surah."
      : null;

  let dateError: string | null = null;
  if (draft.finish === "date") {
    if (!draft.pickedDate) dateError = "Pick a finish date.";
    else if (parseISO(draft.pickedDate) < startOfDay(today)) dateError = "Pick a date from today onwards.";
  }

  let pageError: string | null = null;
  let startPage = goalStart;
  if (draft.startFrom === "current") {
    const page = Number(draft.currentPage);
    if (!draft.currentPage.trim()) pageError = "Enter the page you're on.";
    else if (!Number.isInteger(page) || page < goalStart || page > goalEnd) {
      pageError = `Enter a page between ${goalStart} and ${goalEnd}.`;
    } else startPage = page;
  }

  const finishDate = finishDateFor(draft, today, ramadanEnd);

  return {
    title: goalTitle(draft.goal, draft.startSurah, draft.endSurah),
    goalStart,
    goalEnd,
    startPage,
    finishDate,
    pagesRemaining: pagesToGo(startPage, goalEnd),
    perDay: finishDate ? paceUntil(startPage, goalEnd, today, finishDate) : null,
    rangeError,
    dateError,
    pageError,
  };
}
