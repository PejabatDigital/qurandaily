// Talks to the Worker's API (worker/api.ts) and sign-in routes (/api/auth/*). The
// session is a same-site cookie set by the Worker, so nothing is stored here.
import type { Campaign, Profile, ReadingLog } from "./api-types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Better Auth's error code, e.g. INVALID_OTP, or ours, e.g. TOO_SOON. */
    public code?: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

// Called when the API says the session has gone (expired, or signed out elsewhere).
let onSignedOut: () => void = () => {};
export function setSignedOutHandler(handler: () => void) {
  onSignedOut = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Couldn't connect. Check your internet and try again.");
  }
  const data = await r.json().catch(() => null);
  if (!r.ok) {
    if (r.status === 401 && !path.startsWith("/api/auth/")) onSignedOut();
    const retryAfter = Number(r.headers.get("retry-after") ?? r.headers.get("x-retry-after")) || undefined;
    throw new ApiError(r.status, data?.message || data?.error || "Something went wrong. Please try again.", data?.code, retryAfter);
  }
  return data as T;
}

type CampaignInput = Pick<Campaign, "title" | "start_page" | "end_page" | "start_date" | "end_date"> & { is_active?: boolean };

export const api = {
  campaigns: () => request<Campaign[]>("GET", "/api/campaigns"),
  createCampaign: (c: CampaignInput) => request<Campaign>("POST", "/api/campaigns", c),
  updateCampaign: (id: string, changes: Partial<CampaignInput>) =>
    request<Campaign>("PATCH", `/api/campaigns/${encodeURIComponent(id)}`, changes),
  deleteCampaign: (id: string) => request<{ ok: true }>("DELETE", `/api/campaigns/${encodeURIComponent(id)}`),
  markMilestonesShown: (id: string, keys: string[]) =>
    request<{ ok: true }>("POST", `/api/campaigns/${encodeURIComponent(id)}/milestones`, { keys }),

  logs: () => request<ReadingLog[]>("GET", "/api/logs"),
  createLog: (l: Pick<ReadingLog, "campaign_id" | "pages_read" | "current_page_marker">) =>
    request<ReadingLog>("POST", "/api/logs", l),
  updateLog: (id: string, changes: Partial<Pick<ReadingLog, "pages_read" | "current_page_marker" | "created_at">>) =>
    request<ReadingLog>("PATCH", `/api/logs/${encodeURIComponent(id)}`, changes),
  deleteLog: (id: string) => request<{ ok: true }>("DELETE", `/api/logs/${encodeURIComponent(id)}`),

  profile: () => request<Profile>("GET", "/api/profile"),
  updateProfile: (changes: Partial<Pick<Profile, "display_name" | "prayer_zone">>) =>
    request<Profile>("PATCH", "/api/profile", changes),

  deleteAccount: () => request<{ ok: true }>("DELETE", "/api/account"),
};

export interface SessionUser {
  id: string;
  email: string;
}

export const auth = {
  /** The signed-in user, or null. Asking also renews the session. */
  async session(): Promise<SessionUser | null> {
    const s = await request<{ user: SessionUser } | null>("GET", "/api/auth/get-session");
    return s?.user ? { id: s.user.id, email: s.user.email } : null;
  },
  /** Emails a 6-digit code. A new email gets an account when the code is used. */
  sendCode: (email: string) =>
    request<{ success: true }>("POST", "/api/auth/email-otp/send-verification-otp", { email, type: "sign-in" }),
  async signIn(email: string, code: string): Promise<SessionUser> {
    const r = await request<{ user: SessionUser }>("POST", "/api/auth/sign-in/email-otp", { email, otp: code });
    return { id: r.user.id, email: r.user.email };
  },
  signOut: () => request<{ success: true }>("POST", "/api/auth/sign-out", {}),
};
