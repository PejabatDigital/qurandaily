/* D1 queries. Every query is scoped to one user_id, which is what keeps each person's
   data private: a row that isn't the user's is treated as missing. */
import type { Campaign, Profile, ReadingLog } from "../src/lib/api-types";

type CampaignRow = Omit<Campaign, "is_active" | "milestones_shown"> & { is_active: number; milestones_shown: string };

const toCampaign = (r: CampaignRow): Campaign => ({
  ...r,
  is_active: r.is_active === 1,
  milestones_shown: JSON.parse(r.milestones_shown),
});

const now = () => new Date().toISOString();

/* Newest first. */
export async function listCampaigns(db: D1Database, userId: string): Promise<Campaign[]> {
  const { results } = await db
    .prepare("SELECT * FROM campaigns WHERE user_id = ?1 ORDER BY created_at DESC")
    .bind(userId)
    .all<CampaignRow>();
  return results.map(toCampaign);
}

export async function getCampaign(db: D1Database, userId: string, id: string): Promise<Campaign | null> {
  const row = await db.prepare("SELECT * FROM campaigns WHERE id = ?1 AND user_id = ?2").bind(id, userId).first<CampaignRow>();
  return row ? toCampaign(row) : null;
}

/* Switches off the user's other active plan, so the one being saved can be active
   (the database also allows only one). */
const deactivateOthers = (db: D1Database, userId: string, keepId: string) =>
  db.prepare("UPDATE campaigns SET is_active = 0, updated_at = ?3 WHERE user_id = ?1 AND id != ?2 AND is_active = 1").bind(userId, keepId, now());

export async function createCampaign(
  db: D1Database,
  userId: string,
  c: Pick<Campaign, "title" | "start_page" | "end_page" | "start_date" | "end_date" | "is_active">,
): Promise<Campaign> {
  const id = crypto.randomUUID(), t = now();
  const insert = db
    .prepare(
      `INSERT INTO campaigns (id, user_id, title, start_page, end_page, start_date, end_date, is_active, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)`,
    )
    .bind(id, userId, c.title, c.start_page, c.end_page, c.start_date, c.end_date, c.is_active ? 1 : 0, t);
  await db.batch(c.is_active ? [deactivateOthers(db, userId, id), insert] : [insert]);
  return (await getCampaign(db, userId, id))!;
}

/* Saves an already-checked plan (see api.ts) owned by the user. */
export async function updateCampaign(db: D1Database, userId: string, c: Campaign): Promise<Campaign> {
  const update = db
    .prepare(
      `UPDATE campaigns SET title = ?3, start_page = ?4, end_page = ?5, end_date = ?6, is_active = ?7, updated_at = ?8
       WHERE id = ?1 AND user_id = ?2`,
    )
    .bind(c.id, userId, c.title, c.start_page, c.end_page, c.end_date, c.is_active ? 1 : 0, now());
  await db.batch(c.is_active ? [deactivateOthers(db, userId, c.id), update] : [update]);
  return (await getCampaign(db, userId, c.id))!;
}

/* Adds milestone keys to what's been shown for the plan. Returns false if it isn't the user's. */
export async function addShownMilestones(db: D1Database, userId: string, id: string, keys: string[]): Promise<boolean> {
  const c = await getCampaign(db, userId, id);
  if (!c) return false;
  const shown = [...new Set([...c.milestones_shown, ...keys])];
  await db
    .prepare("UPDATE campaigns SET milestones_shown = ?3, updated_at = ?4 WHERE id = ?1 AND user_id = ?2")
    .bind(id, userId, JSON.stringify(shown), now())
    .run();
  return true;
}

/* Deletes the plan and its logs. Returns false if it isn't the user's. */
export async function deleteCampaign(db: D1Database, userId: string, id: string): Promise<boolean> {
  const [, r] = await db.batch([
    db.prepare("DELETE FROM reading_logs WHERE campaign_id = ?1 AND user_id = ?2").bind(id, userId),
    db.prepare("DELETE FROM campaigns WHERE id = ?1 AND user_id = ?2").bind(id, userId),
  ]);
  return r.meta.changes > 0;
}

/* Newest first. */
export async function listLogs(db: D1Database, userId: string): Promise<ReadingLog[]> {
  const { results } = await db
    .prepare("SELECT * FROM reading_logs WHERE user_id = ?1 ORDER BY created_at DESC")
    .bind(userId)
    .all<ReadingLog>();
  return results;
}

/* Logs reading on one of the user's plans. Returns null if the plan isn't theirs. */
export async function createLog(
  db: D1Database,
  userId: string,
  l: Pick<ReadingLog, "campaign_id" | "pages_read" | "current_page_marker">,
): Promise<ReadingLog | null> {
  const log: ReadingLog = { id: crypto.randomUUID(), user_id: userId, created_at: now(), ...l };
  const r = await db
    .prepare(
      `INSERT INTO reading_logs (id, campaign_id, user_id, pages_read, current_page_marker, created_at)
       SELECT ?1, id, ?3, ?4, ?5, ?6 FROM campaigns WHERE id = ?2 AND user_id = ?3`,
    )
    .bind(log.id, log.campaign_id, userId, log.pages_read, log.current_page_marker, log.created_at)
    .run();
  return r.meta.changes > 0 ? log : null;
}

/* Changes a log's pages or time. Returns null if the log isn't the user's. */
export async function updateLog(
  db: D1Database,
  userId: string,
  id: string,
  changes: Partial<Pick<ReadingLog, "pages_read" | "current_page_marker" | "created_at">>,
): Promise<ReadingLog | null> {
  const current = await db.prepare("SELECT * FROM reading_logs WHERE id = ?1 AND user_id = ?2").bind(id, userId).first<ReadingLog>();
  if (!current) return null;
  const next = { ...current, ...changes };
  await db
    .prepare("UPDATE reading_logs SET pages_read = ?3, current_page_marker = ?4, created_at = ?5 WHERE id = ?1 AND user_id = ?2")
    .bind(id, userId, next.pages_read, next.current_page_marker, next.created_at)
    .run();
  return next;
}

/* Returns false if the log isn't the user's. */
export async function deleteLog(db: D1Database, userId: string, id: string): Promise<boolean> {
  const r = await db.prepare("DELETE FROM reading_logs WHERE id = ?1 AND user_id = ?2").bind(id, userId).run();
  return r.meta.changes > 0;
}

export async function getProfile(db: D1Database, userId: string): Promise<Profile> {
  const row = await db
    .prepare(
      `SELECT u.email, p.display_name, p.prayer_zone FROM "user" u
       LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?1`,
    )
    .bind(userId)
    .first<Profile>();
  return { email: row?.email ?? "", display_name: row?.display_name ?? null, prayer_zone: row?.prayer_zone ?? null };
}

/* Saves the given fields; the profile is created if it's somehow missing. */
export async function updateProfile(
  db: D1Database,
  userId: string,
  changes: Partial<Pick<Profile, "display_name" | "prayer_zone">>,
): Promise<Profile> {
  const t = now();
  const statements = [
    db.prepare("INSERT OR IGNORE INTO profiles (user_id, created_at, updated_at) VALUES (?1, ?2, ?2)").bind(userId, t),
  ];
  if ("display_name" in changes)
    statements.push(db.prepare("UPDATE profiles SET display_name = ?2, updated_at = ?3 WHERE user_id = ?1").bind(userId, changes.display_name, t));
  if ("prayer_zone" in changes)
    statements.push(db.prepare("UPDATE profiles SET prayer_zone = ?2, updated_at = ?3 WHERE user_id = ?1").bind(userId, changes.prayer_zone, t));
  await db.batch(statements);
  return getProfile(db, userId);
}

/* Deletes everything stored for one person: logs, plans, profile, sign-in records and
   the account. The session goes too, so the browser's cookie stops working. */
export async function deleteAccount(db: D1Database, userId: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM reading_logs WHERE user_id = ?1").bind(userId),
    db.prepare("DELETE FROM campaigns WHERE user_id = ?1").bind(userId),
    db.prepare("DELETE FROM profiles WHERE user_id = ?1").bind(userId),
    db.prepare(`DELETE FROM "verification" WHERE "identifier" = 'sign-in-otp-' || (SELECT "email" FROM "user" WHERE "id" = ?1)`).bind(userId),
    db.prepare('DELETE FROM "session" WHERE "userId" = ?1').bind(userId),
    db.prepare('DELETE FROM "account" WHERE "userId" = ?1').bind(userId),
    db.prepare('DELETE FROM "user" WHERE "id" = ?1').bind(userId),
  ]);
}
