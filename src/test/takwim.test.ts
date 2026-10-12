import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isNewHijriMonth, hijriRangeLabel, searchGregorian, searchHijri, todayInTakwim,
} from "@/lib/takwim";

afterEach(() => {
  vi.useRealTimers();
});

describe("isNewHijriMonth", () => {
  it("flags the day a Hijri month changes", () => {
    // 20 Jan 2026 = 1 Syaaban 1447
    expect(isNewHijriMonth(0, 19)).toBe(true);
    expect(isNewHijriMonth(0, 18)).toBe(false);
  });

  it("only flags the 1st of a Gregorian month if it is also 1st of a Hijri month", () => {
    expect(isNewHijriMonth(0, 0)).toBe(false);
  });
});

describe("hijriRangeLabel", () => {
  it("spans the Hijri months covered by a Gregorian month", () => {
    expect(hijriRangeLabel(0)).toBe("Rejab 1447 – Syaaban 1447");
    expect(hijriRangeLabel(1)).toBe("Syaaban 1447 – Ramadan 1447");
  });
});

describe("searchGregorian", () => {
  it("matches Malay, English and short month names with a day", () => {
    expect(searchGregorian("3 Mac", 0)).toEqual({ m: 2, d: 2 });
    expect(searchGregorian("march 3", 0)).toEqual({ m: 2, d: 2 });
    expect(searchGregorian("OGS 15", 0)).toEqual({ m: 7, d: 14 });
  });

  it("uses the fallback month for a bare day number", () => {
    expect(searchGregorian("10", 4)).toEqual({ m: 4, d: 9 });
  });

  it("rejects days outside the month and empty queries", () => {
    expect(searchGregorian("30 Feb", 0)).toBeNull();
    expect(searchGregorian("   ", 0)).toBeNull();
  });
});

describe("searchHijri", () => {
  it("finds the Gregorian date of a Hijri date", () => {
    // 1 Ramadan 1447 = 19 Feb 2026
    expect(searchHijri("1 Ramadan")).toEqual({ m: 1, d: 18 });
    expect(searchHijri("syw 1")).toEqual({ m: 2, d: 19 });
  });

  it("returns null for unknown months", () => {
    expect(searchHijri("foo 1")).toBeNull();
  });
});

describe("todayInTakwim", () => {
  it("returns the month/day index for a date in the data", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 12, 9, 0));
    expect(todayInTakwim()).toEqual({ m: 9, d: 11 });
  });

  it("returns null when there is no data for the year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2030, 0, 1, 9, 0));
    expect(todayInTakwim()).toBeNull();
  });
});
