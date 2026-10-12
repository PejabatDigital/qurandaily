import { describe, it, expect, beforeEach } from "vitest";
import {
  COMPLETE_MESSAGE, PROGRESS_MILESTONES, STREAK_MILESTONES,
  dueMilestones, loadShownMilestones, saveShownMilestones,
} from "@/lib/milestones";

beforeEach(() => {
  localStorage.clear();
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

describe("shown milestone storage", () => {
  it("persists per reading plan", () => {
    saveShownMilestones("plan-a", new Set(["progress-25"]));
    expect([...loadShownMilestones("plan-a")]).toEqual(["progress-25"]);
    expect(loadShownMilestones("plan-b").size).toBe(0);
    expect(JSON.parse(localStorage.getItem("qd:milestones:plan-a")!)).toEqual(["progress-25"]);
  });

  it("ignores corrupted storage", () => {
    localStorage.setItem("qd:milestones:plan-c", "{not json");
    expect(loadShownMilestones("plan-c").size).toBe(0);
  });

  it("still remembers for the session when storage throws", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("blocked"); };
    try {
      saveShownMilestones("plan-d", new Set(["streak-7"]));
    } finally {
      Storage.prototype.setItem = original;
    }
    expect(loadShownMilestones("plan-d").has("streak-7")).toBe(true);
  });
});
