// The catch-up card can be dismissed for the rest of the day, per reading
// plan. Remembered in localStorage on this device; if storage is blocked the
// dismissal only lasts until the page reloads.
import { format } from "date-fns";

const key = (campaignId: string) => `qd:catchup-dismissed:${campaignId}`;
const day = (d: Date) => format(d, "yyyy-MM-dd");

export function isCatchUpDismissed(campaignId: string, today: Date = new Date()): boolean {
  try {
    return localStorage.getItem(key(campaignId)) === day(today);
  } catch {
    return false;
  }
}

export function dismissCatchUp(campaignId: string, today: Date = new Date()): void {
  try {
    localStorage.setItem(key(campaignId), day(today));
  } catch {
    // Storage unavailable: the caller's state still hides it for now.
  }
}
