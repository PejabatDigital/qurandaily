import { describe, expect, it } from "vitest";
import { dayAt, labelledDays, pageTicks } from "@/lib/chart";

describe("pageTicks", () => {
  it("gives an empty or small chart a 0–4 axis", () => {
    expect(pageTicks(0)).toEqual([0, 1, 2, 3, 4]);
    expect(pageTicks(3)).toEqual([0, 1, 2, 3, 4]);
  });

  it("uses round steps that reach the highest day", () => {
    expect(pageTicks(21)).toEqual([0, 10, 20, 30]);
    expect(pageTicks(20)).toEqual([0, 5, 10, 15, 20]);
    expect(pageTicks(7)).toEqual([0, 2, 4, 6, 8]);
    expect(pageTicks(45)).toEqual([0, 20, 40, 60]);
    expect(pageTicks(604)).toEqual([0, 200, 400, 600, 800]);
  });

  it("only uses whole pages", () => {
    for (const max of [1, 5, 9, 13, 37, 150]) {
      const ticks = pageTicks(max);
      expect(ticks.every(Number.isInteger)).toBe(true);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
    }
  });
});

describe("labelledDays", () => {
  it("labels every day of a week", () => {
    expect(labelledDays(7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(labelledDays(1)).toEqual([0]);
  });

  it("labels about six days of a longer range, always including today", () => {
    const labels = labelledDays(30);
    expect(labels[labels.length - 1]).toBe(29);
    expect(labels.length).toBeLessThanOrEqual(6);
    const year = labelledDays(365);
    expect(year[year.length - 1]).toBe(364);
  });
});

describe("dayAt", () => {
  it("finds the nearest day across the chart", () => {
    expect(dayAt(0, 300, 30)).toBe(0);
    expect(dayAt(300, 300, 30)).toBe(29);
    expect(dayAt(150, 300, 31)).toBe(15);
  });

  it("stays inside the range", () => {
    expect(dayAt(-20, 300, 30)).toBe(0);
    expect(dayAt(999, 300, 30)).toBe(29);
    expect(dayAt(100, 300, 1)).toBe(0);
  });
});
