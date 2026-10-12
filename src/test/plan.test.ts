import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import {
  JUZ_AMMA_START_PAGE, dailyPace, daysInclusive, finishAfterDays, finishAfterYears,
  goalPages, goalTitle, pagesLabel, pagesPerPrayer, pagesToGo,
} from "@/lib/plan";
import { endOfRamadan } from "@/lib/takwim";

const MON_12_OCT = new Date(2026, 9, 12, 9, 30);
const fmt = (d: Date) => format(d, "EEE d MMM yyyy");

describe("finish dates", () => {
  it("counts today as day 1 of an N-day plan", () => {
    expect(fmt(finishAfterDays(MON_12_OCT, 30))).toBe("Tue 10 Nov 2026");
    expect(fmt(finishAfterDays(MON_12_OCT, 1))).toBe("Mon 12 Oct 2026");
  });

  it("ends a 1-year plan the day before the same date next year", () => {
    expect(fmt(finishAfterYears(MON_12_OCT, 1))).toBe("Mon 11 Oct 2027");
  });
});

describe("daysInclusive", () => {
  it("counts both ends, ignoring the time of day", () => {
    expect(daysInclusive(MON_12_OCT, new Date(2026, 10, 10))).toBe(30);
    expect(daysInclusive(MON_12_OCT, new Date(2026, 9, 12))).toBe(1);
  });

  it("never drops below 1 for past dates", () => {
    expect(daysInclusive(MON_12_OCT, new Date(2026, 0, 1))).toBe(1);
  });
});

describe("dailyPace", () => {
  it("rounds up so the plan finishes on time", () => {
    expect(dailyPace(604, 30)).toBe(21);
    expect(dailyPace(600, 30)).toBe(20);
  });

  it("is 0 when nothing is left and copes with 0 days", () => {
    expect(dailyPace(0, 10)).toBe(0);
    expect(dailyPace(-5, 10)).toBe(0);
    expect(dailyPace(10, 0)).toBe(10);
  });
});

describe("pagesPerPrayer", () => {
  it("splits the day across five prayers", () => {
    expect(pagesPerPrayer(21)).toBe(4);
    expect(pagesPerPrayer(13)).toBe(3);
  });

  it("never says 0 while there's reading to do", () => {
    expect(pagesPerPrayer(2)).toBe(1);
    expect(pagesPerPrayer(0)).toBe(0);
  });
});

describe("goals", () => {
  it("maps goals to page ranges", () => {
    expect(goalPages("full", "1", "1")).toEqual({ start: 1, end: 604 });
    expect(JUZ_AMMA_START_PAGE).toBe(582);
    expect(goalPages("juzAmma", "1", "1")).toEqual({ start: 582, end: 604 });
    expect(goalPages("range", "2", "3")).toEqual({ start: 2, end: 76 });
  });

  it("names plans after the goal", () => {
    expect(goalTitle("full", "1", "114")).toBe("Full Quran (khatam)");
    expect(goalTitle("juzAmma", "1", "114")).toBe("Juz Amma (Juz 30)");
    expect(goalTitle("range", "18", "18")).toBe("Al-Kahf");
    expect(goalTitle("range", "2", "3")).toBe("Al-Baqarah – Aal-E-Imran");
  });

  it("counts the starting page as still to read", () => {
    expect(pagesToGo(1, 604)).toBe(604);
    expect(pagesToGo(214, 604)).toBe(391);
  });

  it("pluralises pages", () => {
    expect(pagesLabel(1)).toBe("1 page");
    expect(pagesLabel(21)).toBe("21 pages");
  });
});

describe("endOfRamadan", () => {
  it("returns the day before JAKIM's 1 Syawal for the next Ramadan", () => {
    expect(fmt(endOfRamadan(MON_12_OCT)!)).toBe("Tue 9 Mar 2027");
    expect(dailyPace(604, daysInclusive(MON_12_OCT, endOfRamadan(MON_12_OCT)!))).toBe(5);
  });

  it("returns the current Ramadan while it's running, including its last day", () => {
    // 1 Syawal 1447 was 21 Mar 2026
    expect(fmt(endOfRamadan(new Date(2026, 2, 1))!)).toBe("Fri 20 Mar 2026");
    expect(fmt(endOfRamadan(new Date(2026, 2, 20))!)).toBe("Fri 20 Mar 2026");
    expect(fmt(endOfRamadan(new Date(2026, 2, 21))!)).toBe("Tue 9 Mar 2027");
  });

  it("returns null when the takwim data doesn't cover the next Ramadan", () => {
    expect(endOfRamadan(new Date(2027, 2, 10))).toBeNull();
    expect(endOfRamadan(new Date(2099, 0, 1))).toBeNull();
  });
});
