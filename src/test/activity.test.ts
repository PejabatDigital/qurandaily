import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import { planActivity } from "@/lib/activity";

const day = (d: number, month = 8) => new Date(2026, month, d);
const at = (d: number, month = 8, hour = 21) => new Date(2026, month, d, hour).toISOString();
const days = (activity: { date: Date }[]) => activity.map((a) => format(a.date, "d MMM"));

// A September plan: 1 Sep to 30 Sep.
const plan = { startDate: day(1), endDate: day(30) };

describe("planActivity", () => {
  it("runs from the plan's start date to today while the plan is running", () => {
    const activity = planActivity({ ...plan, today: day(3), finishedOn: null, logs: [] });
    expect(days(activity)).toEqual(["1 Sep", "2 Sep", "3 Sep"]);
  });

  it("stops at the end date once the plan is over, however long ago", () => {
    const activity = planActivity({ ...plan, today: day(13, 9), finishedOn: null, logs: [] });
    expect(activity).toHaveLength(30);
    expect(days(activity).pop()).toBe("30 Sep");
  });

  it("stops on the day the plan was finished", () => {
    const activity = planActivity({ ...plan, today: day(13, 9), finishedOn: day(20), logs: [] });
    expect(days(activity).pop()).toBe("20 Sep");
  });

  it("adds up each day's logs and leaves days without reading at 0", () => {
    const logs = [
      { created_at: at(3), pages_read: 5 },
      { created_at: at(1, 8, 7), pages_read: 10 },
      { created_at: at(1), pages_read: 4 },
    ];
    const activity = planActivity({ ...plan, today: day(3), finishedOn: null, logs });
    expect(activity.map((a) => a.pages)).toEqual([14, 0, 5]);
  });

  it("starts early enough to show logs from before the start date", () => {
    const logs = [{ created_at: at(30, 7), pages_read: 6 }];
    const activity = planActivity({ ...plan, today: day(2), finishedOn: null, logs });
    expect(days(activity)).toEqual(["30 Aug", "31 Aug", "1 Sep", "2 Sep"]);
    expect(activity[0].pages).toBe(6);
  });

  it("still shows the start day for a plan that hasn't begun", () => {
    const activity = planActivity({ ...plan, today: day(25, 7), finishedOn: null, logs: [] });
    expect(days(activity)).toEqual(["1 Sep"]);
  });
});
