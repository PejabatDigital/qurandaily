import { describe, it, expect } from "vitest";
import {
  TAKWIM_YEARS, buildTakwimYear, getTakwimYear, getDayEntry, isNewHijriMonth, hijriRangeLabel,
  searchGregorian, searchHijri, stepMonth, todayInTakwim, type TakwimYear,
} from "@/lib/takwim";
import { HIJRI_MONTH_ORDER, TAKWIM_SOURCES } from "@/data/takwim";

const t2026 = getTakwimYear(2026) as TakwimYear;

describe("Takwim data", () => {
  it.each(TAKWIM_SOURCES.map((s) => [s.year, s] as const))("%i expands to a valid calendar year", (_, src) => {
    const t = buildTakwimYear(src);
    expect(t.days.flat()).toHaveLength(src.year % 4 === 0 ? 366 : 365);
    t.days.forEach((month, m) => {
      expect(t.firstDow[m]).toBe(new Date(src.year, m, 1).getDay());
      month.forEach(([, , , dayCode], d) => {
        expect(dayCode).toBe("AITRKJS"[new Date(src.year, m, d + 1).getDay()]);
      });
    });
  });

  it.each(TAKWIM_SOURCES.map((s) => [s.year, s] as const))("%i has only 29- or 30-day Hijri months", (_, src) => {
    const starts = src.monthStarts.map(([md]) => new Date(`${src.year}-${md}T00:00:00Z`).getTime());
    for (let i = 1; i < starts.length; i++) {
      expect([29, 30]).toContain((starts[i] - starts[i - 1]) / 86_400_000);
    }
  });

  it("continues Hijri dates across year boundaries", () => {
    for (const year of TAKWIM_YEARS) {
      const next = getTakwimYear(year + 1);
      if (!next) continue;
      const [hDay, hMonth, hYear] = getTakwimYear(year)!.days[11][30];
      const [nDay, nMonth, nYear] = next.days[0][0];
      if (nDay === 1) {
        expect(nMonth).toBe(HIJRI_MONTH_ORDER[(HIJRI_MONTH_ORDER.indexOf(hMonth) + 1) % 12]);
      } else {
        expect([nDay, nMonth, nYear]).toEqual([hDay + 1, hMonth, hYear]);
      }
    }
  });

  // Gazetted Malaysian public holidays, as a cross-check on the Hijri data.
  it.each([
    ["Aidilfitri 2026", 2026, 2, 21, [1, "SYW", 1447]],
    ["Aidiladha 2026", 2026, 4, 27, [10, "ZHJ", 1447]],
    ["Awal Muharram 2026", 2026, 5, 17, [1, "MUH", 1448]],
    ["Maulidur Rasul 2026", 2026, 7, 25, [12, "RAW", 1448]],
  ] as const)("puts %s on the right day", (_, year, m, day, hijri) => {
    expect(getDayEntry({ year, m, d: day - 1 })?.slice(0, 3)).toEqual(hijri);
  });

  it("rejects month starts out of order", () => {
    expect(() => buildTakwimYear({
      year: 2026, source: "test", jan1: [11, "REJ", 1447], monthStarts: [["01-20", "RAM", 1447]],
    })).toThrow(/should be SYB/);
  });

  it("rejects Hijri months longer than 30 days", () => {
    expect(() => buildTakwimYear({
      year: 2026, source: "test", jan1: [11, "REJ", 1447], monthStarts: [],
    })).toThrow(/past 30 days/);
  });
});

describe("getTakwimYear / getDayEntry", () => {
  it("returns null for years without data", () => {
    expect(getTakwimYear(1990)).toBeNull();
    expect(getDayEntry({ year: 1990, m: 0, d: 0 })).toBeNull();
  });

  it("looks up a day", () => {
    expect(getDayEntry({ year: 2026, m: 0, d: 0 })).toEqual([11, "REJ", 1447, "K"]);
  });
});

describe("isNewHijriMonth", () => {
  it("flags the day a Hijri month changes", () => {
    // 20 Jan 2026 = 1 Syaaban 1447
    expect(isNewHijriMonth(t2026, 0, 19)).toBe(true);
    expect(isNewHijriMonth(t2026, 0, 18)).toBe(false);
  });

  it("only flags the 1st of a Gregorian month if it is also 1st of a Hijri month", () => {
    expect(isNewHijriMonth(t2026, 0, 0)).toBe(false);
  });
});

describe("hijriRangeLabel", () => {
  it("spans the Hijri months covered by a Gregorian month", () => {
    expect(hijriRangeLabel(t2026, 0)).toBe("Rejab 1447 – Syaaban 1447");
    expect(hijriRangeLabel(t2026, 1)).toBe("Syaaban 1447 – Ramadan 1447");
  });
});

describe("searchGregorian", () => {
  it("matches Malay, English and short month names with a day", () => {
    expect(searchGregorian(t2026, "3 Mac", 0)).toEqual({ m: 2, d: 2 });
    expect(searchGregorian(t2026, "march 3", 0)).toEqual({ m: 2, d: 2 });
    expect(searchGregorian(t2026, "OGS 15", 0)).toEqual({ m: 7, d: 14 });
  });

  it("uses the fallback month for a bare day number", () => {
    expect(searchGregorian(t2026, "10", 4)).toEqual({ m: 4, d: 9 });
  });

  it("rejects days outside the month and empty queries", () => {
    expect(searchGregorian(t2026, "30 Feb", 0)).toBeNull();
    expect(searchGregorian(t2026, "   ", 0)).toBeNull();
  });
});

describe("searchHijri", () => {
  it("finds the Gregorian date of a Hijri date", () => {
    // 1 Ramadan 1447 = 19 Feb 2026
    expect(searchHijri(t2026, "1 Ramadan")).toEqual({ m: 1, d: 18 });
    expect(searchHijri(t2026, "rejab 11")).toEqual({ m: 0, d: 0 });
  });

  it("returns null for unknown months", () => {
    expect(searchHijri(t2026, "foo 1")).toBeNull();
  });
});

describe("todayInTakwim", () => {
  it("returns the year, month and day index for a date in the data", () => {
    expect(todayInTakwim(new Date(2026, 9, 12, 9, 0))).toEqual({ year: 2026, m: 9, d: 11 });
  });

  it("returns null when there is no data for the year", () => {
    expect(todayInTakwim(new Date(1990, 0, 1, 9, 0))).toBeNull();
  });
});

describe("stepMonth", () => {
  const years = [2026, 2027, 2029];

  it("moves within a year", () => {
    expect(stepMonth({ year: 2026, m: 5 }, 1, years)).toEqual({ year: 2026, m: 6 });
    expect(stepMonth({ year: 2026, m: 5 }, -1, years)).toEqual({ year: 2026, m: 4 });
  });

  it("crosses into adjacent years", () => {
    expect(stepMonth({ year: 2026, m: 11 }, 1, years)).toEqual({ year: 2027, m: 0 });
    expect(stepMonth({ year: 2027, m: 0 }, -1, years)).toEqual({ year: 2026, m: 11 });
  });

  it("skips years that are not listed", () => {
    expect(stepMonth({ year: 2027, m: 11 }, 1, years)).toEqual({ year: 2029, m: 0 });
    expect(stepMonth({ year: 2029, m: 0 }, -1, years)).toEqual({ year: 2027, m: 11 });
  });

  it("stops at either end", () => {
    expect(stepMonth({ year: 2026, m: 0 }, -1, years)).toBeNull();
    expect(stepMonth({ year: 2029, m: 11 }, 1, years)).toBeNull();
  });
});
