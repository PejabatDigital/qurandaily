import { beforeEach, describe, expect, it } from "vitest";
import { handleApi } from "./api";
import { addUser, createD1 } from "./test/d1";
import type { Campaign, Profile, ReadingLog } from "../src/lib/api-types";

const ORIGIN = "https://qurandaily.test";
let d1: ReturnType<typeof createD1>;
let env: Env;

// The signed-in user is whoever the test says, via a header only these tests read.
const whoIs = async (request: Request) => request.headers.get("x-test-user");

async function call<T = unknown>(user: string | null, method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const request = new Request(ORIGIN + path, {
    method,
    headers: { ...(user ? { "x-test-user": user } : {}), ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const r = await handleApi(request, env, whoIs);
  return { status: r.status, body: (await r.json()) as T };
}

const plan = (over: Partial<Campaign> = {}) => ({
  title: "Khatam",
  start_page: 1,
  end_page: 604,
  start_date: "2026-10-01",
  end_date: "2026-12-31",
  ...over,
});

const count = (table: string, userId: string) =>
  (d1.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`).get(userId) as { n: number }).n;

beforeEach(() => {
  d1 = createD1();
  env = { DB: d1, BETTER_AUTH_URL: ORIGIN } as unknown as Env;
  addUser(d1, "alice");
  addUser(d1, "bob");
});

describe("sign-in required", () => {
  it.each([
    ["GET", "/api/campaigns"],
    ["POST", "/api/campaigns"],
    ["PATCH", "/api/campaigns/x"],
    ["DELETE", "/api/campaigns/x"],
    ["POST", "/api/campaigns/x/milestones"],
    ["GET", "/api/logs"],
    ["POST", "/api/logs"],
    ["PATCH", "/api/logs/x"],
    ["DELETE", "/api/logs/x"],
    ["GET", "/api/profile"],
    ["PATCH", "/api/profile"],
    ["DELETE", "/api/account"],
  ])("%s %s is refused when signed out", async (method, path) => {
    const r = await call(null, method, path, method === "GET" || method === "DELETE" ? undefined : {});
    expect(r.status).toBe(401);
  });

  it("health works signed out", async () => {
    expect((await call(null, "GET", "/api/health")).status).toBe(200);
  });

  it("refuses changes sent from another site", async () => {
    const r = await call("alice", "POST", "/api/campaigns", plan(), { origin: "https://evil.example" });
    expect(r.status).toBe(403);
    expect(count("campaigns", "alice")).toBe(0);
  });
});

describe("plans", () => {
  it("creates a plan and lists it, newest first", async () => {
    const a = await call<Campaign>("alice", "POST", "/api/campaigns", plan({ title: "First" }));
    expect(a.status).toBe(201);
    expect(a.body).toMatchObject({ title: "First", user_id: "alice", is_active: true, milestones_shown: [] });
    await new Promise((r) => setTimeout(r, 2));
    await call("alice", "POST", "/api/campaigns", plan({ title: "Second" }));
    const list = await call<Campaign[]>("alice", "GET", "/api/campaigns");
    expect(list.body.map((c) => c.title)).toEqual(["Second", "First"]);
  });

  it("keeps only one active plan", async () => {
    const first = (await call<Campaign>("alice", "POST", "/api/campaigns", plan({ title: "First" }))).body;
    await call("alice", "POST", "/api/campaigns", plan({ title: "Second" }));
    const active = async () => (await call<Campaign[]>("alice", "GET", "/api/campaigns")).body.filter((c) => c.is_active).map((c) => c.title);
    expect(await active()).toEqual(["Second"]);

    await call("alice", "PATCH", `/api/campaigns/${first.id}`, { is_active: true });
    expect(await active()).toEqual(["First"]);
  });

  it("the database itself refuses a second active plan", async () => {
    await call("alice", "POST", "/api/campaigns", plan());
    expect(() =>
      d1.sqlite
        .prepare(
          `INSERT INTO campaigns (id, user_id, title, start_page, end_page, start_date, end_date, is_active, created_at, updated_at)
           VALUES ('x', 'alice', 't', 1, 2, '2026-01-01', '2026-01-02', 1, '', '')`,
        )
        .run(),
    ).toThrow(/UNIQUE/);
  });

  it("one person's active plan doesn't affect another's", async () => {
    await call("alice", "POST", "/api/campaigns", plan());
    await call("bob", "POST", "/api/campaigns", plan());
    expect((await call<Campaign[]>("alice", "GET", "/api/campaigns")).body[0].is_active).toBe(true);
  });

  it("edits a plan", async () => {
    const c = (await call<Campaign>("alice", "POST", "/api/campaigns", plan())).body;
    const r = await call<Campaign>("alice", "PATCH", `/api/campaigns/${c.id}`, { title: "Juz Amma", start_page: 582, end_date: "2027-01-31" });
    expect(r.body).toMatchObject({ title: "Juz Amma", start_page: 582, end_page: 604, end_date: "2027-01-31", start_date: "2026-10-01" });
  });

  it("checks pages and dates", async () => {
    expect((await call("alice", "POST", "/api/campaigns", plan({ start_page: 10, end_page: 5 }))).status).toBe(400);
    expect((await call("alice", "POST", "/api/campaigns", plan({ end_page: 605 }))).status).toBe(400);
    expect((await call("alice", "POST", "/api/campaigns", plan({ end_date: "2026-02-30" }))).status).toBe(400);
    expect((await call("alice", "POST", "/api/campaigns", plan({ end_date: "2026-09-01" }))).status).toBe(400);
    expect((await call("alice", "POST", "/api/campaigns", plan({ title: "  " }))).status).toBe(400);
    const c = (await call<Campaign>("alice", "POST", "/api/campaigns", plan())).body;
    expect((await call("alice", "PATCH", `/api/campaigns/${c.id}`, { end_date: "2026-09-30" })).status).toBe(400);
  });

  it("remembers milestones shown, without repeats", async () => {
    const c = (await call<Campaign>("alice", "POST", "/api/campaigns", plan())).body;
    await call("alice", "POST", `/api/campaigns/${c.id}/milestones`, { keys: ["progress-25", "streak-7"] });
    await call("alice", "POST", `/api/campaigns/${c.id}/milestones`, { keys: ["progress-25", "progress-50"] });
    const [saved] = (await call<Campaign[]>("alice", "GET", "/api/campaigns")).body;
    expect(saved.milestones_shown).toEqual(["progress-25", "streak-7", "progress-50"]);
  });

  it("deleting a plan deletes its logs", async () => {
    const c = (await call<Campaign>("alice", "POST", "/api/campaigns", plan())).body;
    await call("alice", "POST", "/api/logs", { campaign_id: c.id, pages_read: 5, current_page_marker: 6 });
    expect((await call("alice", "DELETE", `/api/campaigns/${c.id}`)).status).toBe(200);
    expect(count("campaigns", "alice")).toBe(0);
    expect(count("reading_logs", "alice")).toBe(0);
  });
});

describe("logs", () => {
  it("logs reading with the server's time", async () => {
    const c = (await call<Campaign>("alice", "POST", "/api/campaigns", plan())).body;
    const r = await call<ReadingLog>("alice", "POST", "/api/logs", { campaign_id: c.id, pages_read: 5, current_page_marker: 6 });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ campaign_id: c.id, user_id: "alice", pages_read: 5, current_page_marker: 6 });
    expect(Date.now() - Date.parse(r.body.created_at)).toBeLessThan(5000);
    expect((await call<ReadingLog[]>("alice", "GET", "/api/logs")).body).toHaveLength(1);
  });

  it("checks the numbers", async () => {
    const c = (await call<Campaign>("alice", "POST", "/api/campaigns", plan())).body;
    for (const bad of [{ pages_read: -1, current_page_marker: 2 }, { pages_read: 1, current_page_marker: 606 }, { pages_read: 1.5, current_page_marker: 3 }])
      expect((await call("alice", "POST", "/api/logs", { campaign_id: c.id, ...bad })).status).toBe(400);
    // Logging by last page can record 0 pages.
    expect((await call("alice", "POST", "/api/logs", { campaign_id: c.id, pages_read: 0, current_page_marker: 1 })).status).toBe(201);
  });

  it("edits a log", async () => {
    const c = (await call<Campaign>("alice", "POST", "/api/campaigns", plan())).body;
    const l = (await call<ReadingLog>("alice", "POST", "/api/logs", { campaign_id: c.id, pages_read: 5, current_page_marker: 6 })).body;
    const r = await call<ReadingLog>("alice", "PATCH", `/api/logs/${l.id}`, { pages_read: 7, created_at: "2026-10-18T21:30:00+08:00" });
    expect(r.body).toMatchObject({ id: l.id, pages_read: 7, current_page_marker: 6, created_at: "2026-10-18T13:30:00.000Z" });
    expect((await call<ReadingLog[]>("alice", "GET", "/api/logs")).body[0]).toEqual(r.body);
    expect((await call("alice", "PATCH", `/api/logs/${l.id}`, { created_at: "yesterday" })).status).toBe(400);
  });

  it("deletes a log", async () => {
    const c = (await call<Campaign>("alice", "POST", "/api/campaigns", plan())).body;
    const l = (await call<ReadingLog>("alice", "POST", "/api/logs", { campaign_id: c.id, pages_read: 5, current_page_marker: 6 })).body;
    expect((await call("alice", "DELETE", `/api/logs/${l.id}`)).status).toBe(200);
    expect(count("reading_logs", "alice")).toBe(0);
  });
});

describe("one person can't see or change another's data", () => {
  let alicePlan: Campaign;
  let aliceLog: ReadingLog;

  beforeEach(async () => {
    alicePlan = (await call<Campaign>("alice", "POST", "/api/campaigns", plan())).body;
    aliceLog = (await call<ReadingLog>("alice", "POST", "/api/logs", { campaign_id: alicePlan.id, pages_read: 5, current_page_marker: 6 })).body;
    await call("alice", "PATCH", "/api/profile", { display_name: "Alice", prayer_zone: "WLY01" });
  });

  it("lists", async () => {
    expect((await call<Campaign[]>("bob", "GET", "/api/campaigns")).body).toEqual([]);
    expect((await call<ReadingLog[]>("bob", "GET", "/api/logs")).body).toEqual([]);
    expect((await call<Profile>("bob", "GET", "/api/profile")).body).toEqual({ email: "bob@example.com", display_name: null, prayer_zone: null });
  });

  it("plans", async () => {
    expect((await call("bob", "PATCH", `/api/campaigns/${alicePlan.id}`, { title: "Mine now" })).status).toBe(404);
    expect((await call("bob", "PATCH", `/api/campaigns/${alicePlan.id}`, { is_active: true })).status).toBe(404);
    expect((await call("bob", "POST", `/api/campaigns/${alicePlan.id}/milestones`, { keys: ["complete"] })).status).toBe(404);
    expect((await call("bob", "DELETE", `/api/campaigns/${alicePlan.id}`)).status).toBe(404);
    const [still] = (await call<Campaign[]>("alice", "GET", "/api/campaigns")).body;
    expect(still).toMatchObject({ title: "Khatam", is_active: true, milestones_shown: [] });
  });

  it("logs", async () => {
    expect((await call("bob", "POST", "/api/logs", { campaign_id: alicePlan.id, pages_read: 1, current_page_marker: 7 })).status).toBe(404);
    expect((await call("bob", "PATCH", `/api/logs/${aliceLog.id}`, { pages_read: 99 })).status).toBe(404);
    expect((await call("bob", "DELETE", `/api/logs/${aliceLog.id}`)).status).toBe(404);
    expect((await call<ReadingLog[]>("alice", "GET", "/api/logs")).body[0].pages_read).toBe(5);
    expect(count("reading_logs", "alice")).toBe(1);
    expect(count("reading_logs", "bob")).toBe(0);
  });

  it("can't claim another person's rows by sending their user id", async () => {
    const c = (await call<Campaign>("bob", "POST", "/api/campaigns", { ...plan(), user_id: "alice" })).body;
    expect(c.user_id).toBe("bob");
    const l = (await call<ReadingLog>("bob", "POST", "/api/logs", { campaign_id: c.id, user_id: "alice", pages_read: 1, current_page_marker: 2 })).body;
    expect(l.user_id).toBe("bob");
    expect(count("campaigns", "alice")).toBe(1);
  });

  it("deleting an account leaves everyone else's data alone", async () => {
    const bobPlan = (await call<Campaign>("bob", "POST", "/api/campaigns", plan())).body;
    await call("bob", "POST", "/api/logs", { campaign_id: bobPlan.id, pages_read: 1, current_page_marker: 2 });
    expect((await call("alice", "DELETE", "/api/account")).status).toBe(200);

    for (const table of ["campaigns", "reading_logs", "profiles"]) expect(count(table, "alice")).toBe(0);
    expect(d1.sqlite.prepare(`SELECT COUNT(*) AS n FROM "user" WHERE id = 'alice'`).get()).toEqual({ n: 0 });
    expect(count("campaigns", "bob")).toBe(1);
    expect(count("reading_logs", "bob")).toBe(1);
    expect(count("profiles", "bob")).toBe(1);
  });
});

describe("profile", () => {
  it("reads and saves the name and zone", async () => {
    expect((await call<Profile>("alice", "GET", "/api/profile")).body).toEqual({ email: "alice@example.com", display_name: null, prayer_zone: null });
    const r = await call<Profile>("alice", "PATCH", "/api/profile", { display_name: "  Aminah ", prayer_zone: "SGR01" });
    expect(r.body).toEqual({ email: "alice@example.com", display_name: "Aminah", prayer_zone: "SGR01" });
    // Only the fields sent change; an empty name clears it.
    const r2 = await call<Profile>("alice", "PATCH", "/api/profile", { display_name: "" });
    expect(r2.body).toEqual({ email: "alice@example.com", display_name: null, prayer_zone: "SGR01" });
  });

  it("refuses a zone that isn't a zone code", async () => {
    expect((await call("alice", "PATCH", "/api/profile", { prayer_zone: "<script>" })).status).toBe(400);
  });

  it("creates the profile if it's missing", async () => {
    d1.sqlite.prepare("DELETE FROM profiles WHERE user_id = 'alice'").run();
    const r = await call<Profile>("alice", "PATCH", "/api/profile", { prayer_zone: "JHR01" });
    expect(r.body.prayer_zone).toBe("JHR01");
  });
});
