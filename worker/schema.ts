/* Input validation for the API. Shapes match src/lib/api-types.ts. */
import { z } from "zod";

export const BODY_MAX = 16_000; // bytes per request body
const LAST_PAGE = 604;

/* A real calendar date, YYYY-MM-DD. */
export function isDate(s: unknown): boolean {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number), t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

const date = z.string().refine(isDate, "must be a date (YYYY-MM-DD)");
const page = z.number().int().min(1).max(LAST_PAGE);
const id = z.string().min(1).max(64);

export const newCampaign = z.object({
  title: z.string().trim().min(1).max(200),
  start_page: page,
  end_page: page,
  start_date: date,
  end_date: date,
  is_active: z.boolean().default(true),
});

export const campaignChanges = z
  .object({
    title: z.string().trim().min(1).max(200),
    start_page: page,
    end_page: page,
    end_date: date,
    is_active: z.boolean(),
  })
  .partial();

/* What a stored plan must satisfy after any change. */
export function campaignProblem(c: { start_page: number; end_page: number; start_date: string; end_date: string }): string | null {
  if (c.start_page > c.end_page) return "The first page must come before the last page";
  if (c.end_date < c.start_date) return "The finish date must be on or after the start date";
  return null;
}

export const milestoneKeys = z.object({
  keys: z.array(z.string().regex(/^[a-z0-9-]{1,32}$/)).min(1).max(20),
});

export const newLog = z.object({
  campaign_id: id,
  pages_read: z.number().int().min(0).max(LAST_PAGE),
  current_page_marker: z.number().int().min(1).max(LAST_PAGE + 1),
});

export const logChanges = z
  .object({
    pages_read: newLog.shape.pages_read,
    current_page_marker: newLog.shape.current_page_marker,
    // stored as a canonical UTC ISO string, so times sort correctly as text
    created_at: z.iso.datetime({ offset: true }).transform((s) => new Date(s).toISOString()),
  })
  .partial();

export const profileChanges = z
  .object({
    // An empty name clears it.
    display_name: z.string().trim().max(100).nullable().transform((s) => s || null),
    prayer_zone: z.string().regex(/^[A-Z]{3}\d{2}$/).nullable(),
  })
  .partial();
