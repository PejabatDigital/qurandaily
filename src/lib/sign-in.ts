// Sign-in screen helpers: what's remembered on the device between switching to the
// mail app and back, the "Send a new code" wait, and messages for each error.
import type { ApiError } from "./api";
import { CODE_MINUTES, RESEND_WAIT_SECONDS } from "./sign-in-rules";

export const RESEND_WAIT_MS = RESEND_WAIT_SECONDS * 1000;

/** A code has been sent to `email`; a new one can be asked for from `waitUntil`. */
export type Pending = { email: string; waitUntil: number };

const KEY = "qd:sign-in";

function load(): Pending | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return p && typeof p.email === "string" && typeof p.waitUntil === "number" ? p : null;
  } catch {
    return null;
  }
}

/** The code step to return to, unless that code has expired by now. */
export function loadPending(now = Date.now()): Pending | null {
  const p = load();
  const sentAt = p ? p.waitUntil - RESEND_WAIT_MS : 0;
  return p && now - sentAt < CODE_MINUTES * 60_000 ? p : null;
}

/** The email last typed, to fill in again. */
export function rememberedEmail(): string {
  return load()?.email ?? "";
}

export function savePending(p: Pending | null): void {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: the screen still works, it just won't survive a reload.
  }
}

/** 0:42 */
export function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** "42 seconds", "12 minutes" */
export function inWords(seconds: number): string {
  if (seconds < 90) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minutes`;
}

const NETWORK = "Couldn't connect. Check your internet and try again.";

export function sendError(e: ApiError): string {
  if (e.status === 0) return NETWORK;
  if (e.code === "TOO_SOON" && e.retryAfter) return `You can ask for a new code in ${inWords(e.retryAfter)}.`;
  if (e.status === 429) return "Too many requests. Please wait a minute and try again.";
  if (e.code === "INVALID_EMAIL") return "That email address doesn't look right.";
  return "Couldn't send the code. Please try again.";
}

export function codeError(e: ApiError): string {
  if (e.status === 0) return NETWORK;
  if (e.code === "INVALID_OTP") return "That code isn't right. Check the email and try again.";
  if (e.code === "OTP_EXPIRED") return "That code has expired. Send a new code.";
  if (e.code === "TOO_MANY_ATTEMPTS") return "Too many wrong tries. Send a new code.";
  if (e.status === 429) return "Too many tries. Please wait a minute and try again.";
  return "Couldn't sign you in. Please try again.";
}
