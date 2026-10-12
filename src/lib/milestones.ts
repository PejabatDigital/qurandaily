// Milestone toasts (streaks, progress, completion), each shown once per
// reading plan. What's been shown is remembered in localStorage on this
// device, with an in-memory copy so a blocked or failing storage still
// limits each milestone to once per session.

export const STREAK_MILESTONES: Record<number, string> = {
  7: "🎉 One week strong! Consistency is key.",
  30: "🌟 A full month of consistency! Amazing dedication.",
  100: "🏆 100 days — truly remarkable. MashaAllah!",
};

export const PROGRESS_MILESTONES: Record<number, string> = {
  25: "📖 Quarter of the way there!",
  50: "🌙 Halfway through! Keep going.",
  75: "✨ The finish line is near!",
};

export const COMPLETE_MESSAGE = "🎊 You've completed your reading plan! SubhanAllah!";

export type Milestone = { key: string; message: string };

const storageKey = (campaignId: string) => `qd:milestones:${campaignId}`;
const memory = new Map<string, Set<string>>();

export function loadShownMilestones(campaignId: string): Set<string> {
  const shown = new Set(memory.get(campaignId));
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(campaignId)) ?? "[]");
    if (Array.isArray(parsed)) {
      for (const key of parsed) if (typeof key === "string") shown.add(key);
    }
  } catch {
    // Storage unavailable or corrupted: fall back to the in-memory copy.
  }
  return shown;
}

export function saveShownMilestones(campaignId: string, shown: Set<string>): void {
  memory.set(campaignId, new Set(shown));
  try {
    localStorage.setItem(storageKey(campaignId), JSON.stringify([...shown]));
  } catch {
    // Storage unavailable: the in-memory copy still covers this session.
  }
}

/**
 * Milestones reached but not yet shown. `show` is what to toast; `markShown`
 * is every key to remember. When several progress milestones are crossed at
 * once (e.g. a big log, or the first visit after this was added) only the
 * highest is shown, and completion replaces any progress milestone.
 */
export function dueMilestones(
  streak: number,
  percentage: number,
  shown: Set<string>,
): { show: Milestone[]; markShown: string[] } {
  const show: Milestone[] = [];
  const markShown: string[] = [];

  const streakKey = `streak-${streak}`;
  if (STREAK_MILESTONES[streak] && !shown.has(streakKey)) {
    show.push({ key: streakKey, message: STREAK_MILESTONES[streak] });
    markShown.push(streakKey);
  }

  const pct = Math.floor(percentage);
  const reached = [25, 50, 75].filter((t) => pct >= t && !shown.has(`progress-${t}`));
  markShown.push(...reached.map((t) => `progress-${t}`));

  if (pct >= 100 && !shown.has("complete")) {
    show.push({ key: "complete", message: COMPLETE_MESSAGE });
    markShown.push("complete");
  } else if (reached.length > 0) {
    const highest = reached[reached.length - 1];
    show.push({ key: `progress-${highest}`, message: PROGRESS_MILESTONES[highest] });
  }

  return { show, markShown };
}
