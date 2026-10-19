import { describe, it, expect, vi, beforeEach } from "vitest";

const saved = vi.hoisted(() => ({ calls: [] as { id: string; keys: string[] }[], fail: false }));
vi.mock("@/lib/api", () => ({
  api: {
    markMilestonesShown: async (id: string, keys: string[]) => {
      if (saved.fail) throw new Error("offline");
      saved.calls.push({ id, keys });
      return { ok: true };
    },
  },
}));

import {
  COMPLETE_MESSAGE, PROGRESS_MILESTONES, STREAK_MILESTONES,
  dueMilestones, markMilestonesShown, shownMilestones,
} from "@/lib/milestones";

beforeEach(() => {
  saved.calls = [];
  saved.fail = false;
});

describe("dueMilestones", () => {
  it("shows nothing before the first milestone", () => {
    expect(dueMilestones(3, 10, new Set())).toEqual({ show: [], markShown: [] });
  });

  it("shows a streak milestone on the exact day", () => {
    const { show } = dueMilestones(7, 10, new Set());
    expect(show).toEqual([{ key: "streak-7", message: STREAK_MILESTONES[7] }]);
  });

  it("skips milestones already shown", () => {
    expect(dueMilestones(7, 30, new Set(["streak-7", "progress-25"]))).toEqual({ show: [], markShown: [] });
  });

  it("shows only the highest progress milestone crossed at once, but remembers all", () => {
    const { show, markShown } = dueMilestones(0, 60, new Set());
    expect(show).toEqual([{ key: "progress-50", message: PROGRESS_MILESTONES[50] }]);
    expect(markShown).toEqual(["progress-25", "progress-50"]);
  });

  it("replaces progress milestones with the completion message at 100%", () => {
    const { show, markShown } = dueMilestones(0, 100, new Set(["progress-25"]));
    expect(show).toEqual([{ key: "complete", message: COMPLETE_MESSAGE }]);
    expect(markShown).toEqual(["progress-50", "progress-75", "complete"]);
  });
});

describe("shown milestones", () => {
  it("come from the plan on the account", () => {
    expect([...shownMilestones({ id: "plan-a", milestones_shown: ["progress-25"] })]).toEqual(["progress-25"]);
  });

  it("are saved to the account and remembered for the session straight away", async () => {
    const done = markMilestonesShown("plan-b", ["streak-7"]);
    expect(shownMilestones({ id: "plan-b", milestones_shown: [] }).has("streak-7")).toBe(true);
    await done;
    expect(saved.calls).toEqual([{ id: "plan-b", keys: ["streak-7"] }]);
  });

  it("are still remembered for the session when saving fails", async () => {
    saved.fail = true;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await markMilestonesShown("plan-c", ["complete"]);
    expect(shownMilestones({ id: "plan-c", milestones_shown: [] }).has("complete")).toBe(true);
  });
});
