// Milestone toasts (streaks, progress, completion), each shown once per
// reading plan. What's been shown is saved on the plan in the account, so a
// new device doesn't replay them, with an in-memory copy so each one still
// shows only once per session while saving (or if saving fails).
import { api } from "./api";
import type { Campaign } from "./api-types";

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

const memory = new Map<string, Set<string>>();

/** Milestone keys already shown for the plan: saved on the account, plus this session's. */
export function shownMilestones(campaign: Pick<Campaign, "id" | "milestones_shown">): Set<string> {
  return new Set([...campaign.milestones_shown, ...(memory.get(campaign.id) ?? [])]);
}

/** Remembers milestone keys as shown, for this session straight away and on the account. */
export async function markMilestonesShown(campaignId: string, keys: string[]): Promise<void> {
  memory.set(campaignId, new Set([...(memory.get(campaignId) ?? []), ...keys]));
  try {
    await api.markMilestonesShown(campaignId, keys);
  } catch (e) {
    // The in-memory copy still covers this session.
    console.warn("Couldn't save shown milestones:", e);
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
