import { describe, it, expect, beforeEach } from "vitest";
import { dismissCatchUp, isCatchUpDismissed } from "@/lib/catch-up";

beforeEach(() => localStorage.clear());

describe("catch-up dismissal", () => {
  it("lasts for the rest of the day, per plan", () => {
    const today = new Date(2026, 9, 12, 8);
    dismissCatchUp("plan-a", today);
    expect(isCatchUpDismissed("plan-a", new Date(2026, 9, 12, 23, 59))).toBe(true);
    expect(isCatchUpDismissed("plan-a", new Date(2026, 9, 13, 0, 1))).toBe(false);
    expect(isCatchUpDismissed("plan-b", today)).toBe(false);
  });
});
