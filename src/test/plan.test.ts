import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import {
  JUZ_AMMA_START_PAGE, dailyPace, daysInclusive, finishAfterDays, finishAfterYears,
  displayPage, goalPages, goalTitle, logFromCount, logFromLastPage, pagesBehind, pagesLabel, pagesPerPrayer, pagesToGo,
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

describe("pagesBehind", () => {
  const plan = { totalPages: 604, startDate: new Date(2026, 9, 1), endDate: new Date(2026, 9, 30) };

  it("compares pages read with the even schedule up to the end of yesterday", () => {
    // 11 of 30 days done by the end of 11 Oct: 604 * 11 / 30 = 221.47 pages expected
    expect(pagesBehind({ ...plan, pagesRead: 200, today: MON_12_OCT })).toBe(21);
    expect(pagesBehind({ ...plan, pagesRead: 220, today: MON_12_OCT })).toBe(1);
    expect(pagesBehind({ ...plan, pagesRead: 221, today: MON_12_OCT })).toBe(0);
  });

  it("is zero or negative when on track or ahead", () => {
    expect(pagesBehind({ ...plan, pagesRead: 222, today: MON_12_OCT })).toBeLessThanOrEqual(0);
    expect(pagesBehind({ ...plan, pagesRead: 400, today: MON_12_OCT })).toBeLessThan(0);
  });

  it("expects nothing on the first day", () => {
    expect(pagesBehind({ ...plan, pagesRead: 0, today: new Date(2026, 9, 1, 20) })).toBe(0);
  });

  it("never expects more than the whole plan", () => {
    expect(pagesBehind({ ...plan, pagesRead: 600, today: new Date(2026, 11, 1) })).toBe(4);
  });
});

describe("logging", () => {
  it("counts the last page read itself", () => {
    // On page 1 (nothing read yet), read page 1.
    expect(logFromLastPage(1, 1)).toEqual({ pagesRead: 1, nextMarker: 2 });
    // On page 50, read up to 59.
    expect(logFromLastPage(50, 59)).toEqual({ pagesRead: 10, nextMarker: 60 });
  });

  it("completes a khatam when the last page read is 604", () => {
    // Last session ended on 603, so the reader is on 604 and reads it.
    expect(logFromLastPage(604, 604)).toEqual({ pagesRead: 1, nextMarker: 605 });
    expect(logFromCount(604, 1, 604)).toEqual({ pagesRead: 1, nextMarker: 605 });
    // 603 pages before plus this 1 = all 604.
    expect(603 + logFromCount(604, 1, 604).pagesRead).toBe(604);
  });

  it("never moves the marker more than one past the plan's last page", () => {
    expect(logFromCount(600, 20, 604).nextMarker).toBe(605);
    expect(logFromCount(590, 5, 604).nextMarker).toBe(595);
  });

  it("logs nothing when going back to an earlier page", () => {
    expect(logFromLastPage(100, 80)).toEqual({ pagesRead: 0, nextMarker: 81 });
  });

  it("shows the plan's last page once finished", () => {
    expect(displayPage(605, 604)).toBe(604);
    expect(displayPage(142, 604)).toBe(142);
  });
});
