import { describe, it, expect } from "vitest";
import { currentStreak, monthSquares, pace, planSummary, projectedFinish } from "@/lib/progress";
import type { Campaign, ReadingLog } from "@/lib/api-types";

const d = (s: string) => new Date(`${s}T10:00:00`);

describe("currentStreak", () => {
  it("counts days in a row back from the end date", () => {
    expect(currentStreak([d("2026-11-07"), d("2026-11-06"), d("2026-11-05"), d("2026-11-03")], d("2026-11-07"))).toBe(3);
  });
  it("is zero when the end date has no log yet", () => {
    expect(currentStreak([d("2026-11-06"), d("2026-11-05")], d("2026-11-07"))).toBe(0);
  });
  it("counts several logs on one day once", () => {
    expect(currentStreak([d("2026-11-07"), new Date("2026-11-07T21:00:00"), d("2026-11-06")], d("2026-11-07"))).toBe(2);
  });
});

describe("pace", () => {
  // 300 pages over 30 days (1-30 Nov): 10 pages a day.
  const plan = { totalPages: 300, startDate: d("2026-11-01"), endDate: d("2026-11-30") };

  it("is behind when short of where the reader should have been by the end of yesterday", () => {
    // Expected by end of 9 Nov: 90.
    expect(pace({ ...plan, pagesRead: 70, today: d("2026-11-10") })).toEqual({ kind: "behind", pages: 20 });
  });
  it("is on track while today's reading can still keep up", () => {
    expect(pace({ ...plan, pagesRead: 90, today: d("2026-11-10") })).toEqual({ kind: "onTrack" });
    expect(pace({ ...plan, pagesRead: 100, today: d("2026-11-10") })).toEqual({ kind: "onTrack" });
  });
  it("is ahead once past where the reader should be by the end of today", () => {
    expect(pace({ ...plan, pagesRead: 112, today: d("2026-11-10") })).toEqual({ kind: "ahead", pages: 12 });
  });
  it("is on track on the first day before reading", () => {
    expect(pace({ ...plan, pagesRead: 0, today: d("2026-11-01") })).toEqual({ kind: "onTrack" });
  });
});

describe("projectedFinish", () => {
  const base = { totalPages: 300, startDate: d("2026-11-01") };

  it("is null before any reading and once complete", () => {
    expect(projectedFinish({ ...base, pagesRead: 0, pagesReadToday: 0, today: d("2026-11-05") })).toBeNull();
    expect(projectedFinish({ ...base, pagesRead: 300, pagesReadToday: 5, today: d("2026-11-05") })).toBeNull();
  });
  it("uses the average since the start, not counting today until something is logged", () => {
    // 1-9 Nov: 90 pages in 9 days = 10 a day; 210 left = 21 days from today (10 Nov).
    const f = projectedFinish({ ...base, pagesRead: 90, pagesReadToday: 0, today: d("2026-11-10") });
    expect(f?.toDateString()).toBe(new Date(2026, 10, 30).toDateString());
  });
  it("starts counting from tomorrow once today has a log", () => {
    // 1-10 Nov: 150 pages in 10 days = 15 a day; 150 left = 10 days from 11 Nov.
    const f = projectedFinish({ ...base, pagesRead: 150, pagesReadToday: 15, today: d("2026-11-10") });
    expect(f?.toDateString()).toBe(new Date(2026, 10, 20).toDateString());
  });
});

describe("monthSquares", () => {
  it("gives every day of the month, marking read days, today and faint days", () => {
    const squares = monthSquares({
      year: 2026,
      month: 10,
      logDates: [d("2026-11-03"), d("2026-11-04"), d("2026-11-07")],
      today: d("2026-11-07"),
      planStart: d("2026-11-03"),
      planEnd: d("2026-11-25"),
    });
    expect(squares).toHaveLength(30);
    expect(squares.filter((s) => s.read).map((s) => s.day)).toEqual([3, 4, 7]);
    expect(squares.find((s) => s.isToday)?.day).toBe(7);
    // Before the plan started, after today, and after the plan ends: faint.
    expect(squares.filter((s) => s.faint).map((s) => s.day)).toEqual([1, 2, ...Array.from({ length: 23 }, (_, i) => i + 8)]);
  });
  it("knows February's length", () => {
    const args = { logDates: [], today: d("2027-03-01"), planStart: d("2027-01-01"), planEnd: d("2027-12-31") };
    expect(monthSquares({ ...args, year: 2027, month: 1 })).toHaveLength(28);
    expect(monthSquares({ ...args, year: 2028, month: 1 })).toHaveLength(29);
  });
});

describe("planSummary", () => {
  const plan: Campaign = {
    id: "p", user_id: "u", title: "Juz Amma (Juz 30)", start_page: 582, end_page: 604,
    start_date: "2026-11-01", end_date: "2026-11-30", is_active: true, milestones_shown: [],
    created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z",
  };
  const log = (pages: number, at: string, campaign = "p"): ReadingLog => ({
    id: at, user_id: "u", campaign_id: campaign, pages_read: pages, current_page_marker: 0, created_at: at,
  });

  it("adds up this plan's reading only", () => {
    const s = planSummary(
      plan,
      [log(3, "2026-11-07T02:00:00Z"), log(5, "2026-11-06T02:00:00Z"), log(9, "2026-11-06T02:00:00Z", "other")],
      d("2026-11-07"),
    );
    expect(s.totalPages).toBe(23);
    expect(s.pagesRead).toBe(8);
    expect(s.pagesReadToday).toBe(3);
    expect(s.streak).toBe(2);
    expect(s.expired).toBe(false);
    expect(s.finishedOn).toBeNull();
  });
});
