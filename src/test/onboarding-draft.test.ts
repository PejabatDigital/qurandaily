import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import { INITIAL_DRAFT, derivePlan, type PlanDraft } from "@/components/onboarding/draft";
import { endOfRamadan } from "@/lib/takwim";

const TODAY = new Date(2026, 9, 12, 9, 30);
const RAMADAN_END = endOfRamadan(TODAY);
const plan = (patch: Partial<PlanDraft> = {}) => derivePlan({ ...INITIAL_DRAFT, ...patch }, TODAY, RAMADAN_END);

describe("derivePlan", () => {
  it("defaults to a full khatam in 30 days", () => {
    const p = plan();
    expect(p.title).toBe("Full Quran (khatam)");
    expect([p.goalStart, p.goalEnd, p.startPage]).toEqual([1, 604, 1]);
    expect(format(p.finishDate!, "yyyy-MM-dd")).toBe("2026-11-10");
    expect(p.perDay).toBe(21);
  });

  it("uses JAKIM's end of Ramadan", () => {
    const p = plan({ finish: "ramadan" });
    expect(format(p.finishDate!, "yyyy-MM-dd")).toBe("2027-03-09");
    expect(p.perDay).toBe(5);
  });

  it("covers Juz Amma and surah ranges", () => {
    expect(plan({ goal: "juzAmma" })).toMatchObject({ goalStart: 582, goalEnd: 604, perDay: 1 });
    expect(plan({ goal: "range", startSurah: "18", endSurah: "18" })).toMatchObject({ goalStart: 293, goalEnd: 304 });
  });

  it("rejects a range that ends before it starts", () => {
    expect(plan({ goal: "range", startSurah: "3", endSurah: "2" }).rangeError).toMatch(/after the start surah/);
    expect(plan({ goal: "range", startSurah: "2", endSurah: "2" }).rangeError).toBeNull();
  });

  it("starts from the page the reader is on", () => {
    const p = plan({ startFrom: "current", currentPage: "214" });
    expect(p.pageError).toBeNull();
    expect(p.startPage).toBe(214);
    expect(p.pagesRemaining).toBe(391);
    expect(p.perDay).toBe(14);
  });

  it("validates the current page against the goal's range", () => {
    expect(plan({ startFrom: "current", currentPage: "" }).pageError).toBe("Enter the page you're on.");
    expect(plan({ startFrom: "current", currentPage: "700" }).pageError).toBe("Enter a page between 1 and 604.");
    expect(plan({ goal: "juzAmma", startFrom: "current", currentPage: "214" }).pageError).toBe(
      "Enter a page between 582 and 604.",
    );
    expect(plan({ startFrom: "current", currentPage: "12.5" }).pageError).toMatch(/between/);
  });

  it("validates a picked finish date", () => {
    expect(plan({ finish: "date" })).toMatchObject({ dateError: "Pick a finish date.", finishDate: null, perDay: null });
    expect(plan({ finish: "date", pickedDate: "2026-10-01" }).dateError).toBe("Pick a date from today onwards.");
    const p = plan({ finish: "date", pickedDate: "2026-10-12" });
    expect(p.dateError).toBeNull();
    expect(p.perDay).toBe(604);
  });
});
