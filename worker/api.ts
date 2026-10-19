/* Quran Daily API, served under /api. Everything except health needs a signed-in user,
   and only ever touches that user's rows (worker/store.ts).

   GET    /api/health                       is the database reachable (no sign-in needed)
   GET    /api/campaigns                    the user's reading plans, newest first
   POST   /api/campaigns                    create a plan; an active one switches the others off
   PATCH  /api/campaigns/:id                change title, pages, finish date, or make it active
   DELETE /api/campaigns/:id                delete a plan and its logs
   POST   /api/campaigns/:id/milestones     remember milestone keys as shown ({keys})
   GET    /api/logs                         the user's reading logs, newest first
   POST   /api/logs                         log reading on one of the user's plans
   PATCH  /api/logs/:id                     change a log's pages or time
   DELETE /api/logs/:id                     delete a log
   GET    /api/profile                      email, display name, prayer zone
   PATCH  /api/profile                      change display name and/or prayer zone
   DELETE /api/account                      delete the user and everything they stored */
import type { z } from "zod";
import { getUserId } from "./auth";
import { BODY_MAX, campaignChanges, campaignProblem, logChanges, milestoneKeys, newCampaign, newLog, profileChanges } from "./schema";
import * as store from "./store";

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
const fail = (status: number, error: string, extra?: object) => json({ error, ...extra }, status);

class HttpError extends Error {
  constructor(public status: number, message: string, public extra?: object) {
    super(message);
  }
}
const notFound = () => new HttpError(404, "Not found");

/* Reads and validates a JSON body against a zod schema. */
async function readBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > BODY_MAX) throw new HttpError(413, "Body is too large");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new HttpError(400, "Body must be JSON");
  }
  const r = schema.safeParse(data);
  if (!r.success)
    throw new HttpError(400, "Invalid body", {
      issues: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  return r.data;
}

interface Ctx {
  request: Request;
  env: Env;
  user: string;
  params: string[];
}
interface Route {
  method: string;
  path: RegExp;
  auth?: false;
  run(ctx: Ctx): Promise<Response>;
}

const routes: Route[] = [
  {
    method: "GET", path: /^\/api\/health$/, auth: false,
    async run({ env }) {
      await env.DB.prepare("SELECT 1").first();
      return json({ ok: true });
    },
  },

  {
    method: "GET", path: /^\/api\/campaigns$/,
    async run({ env, user }) {
      return json(await store.listCampaigns(env.DB, user));
    },
  },
  {
    method: "POST", path: /^\/api\/campaigns$/,
    async run({ request, env, user }) {
      const c = await readBody(request, newCampaign);
      const problem = campaignProblem(c);
      if (problem) throw new HttpError(400, problem);
      return json(await store.createCampaign(env.DB, user, c), 201);
    },
  },
  {
    method: "PATCH", path: /^\/api\/campaigns\/([^/]+)$/,
    async run({ request, env, user, params: [id] }) {
      const changes = await readBody(request, campaignChanges);
      const current = await store.getCampaign(env.DB, user, id);
      if (!current) throw notFound();
      const next = { ...current, ...changes };
      const problem = campaignProblem(next);
      if (problem) throw new HttpError(400, problem);
      return json(await store.updateCampaign(env.DB, user, next));
    },
  },
  {
    method: "DELETE", path: /^\/api\/campaigns\/([^/]+)$/,
    async run({ env, user, params: [id] }) {
      if (!(await store.deleteCampaign(env.DB, user, id))) throw notFound();
      return json({ ok: true });
    },
  },
  {
    method: "POST", path: /^\/api\/campaigns\/([^/]+)\/milestones$/,
    async run({ request, env, user, params: [id] }) {
      const { keys } = await readBody(request, milestoneKeys);
      if (!(await store.addShownMilestones(env.DB, user, id, keys))) throw notFound();
      return json({ ok: true });
    },
  },

  {
    method: "GET", path: /^\/api\/logs$/,
    async run({ env, user }) {
      return json(await store.listLogs(env.DB, user));
    },
  },
  {
    method: "POST", path: /^\/api\/logs$/,
    async run({ request, env, user }) {
      const log = await store.createLog(env.DB, user, await readBody(request, newLog));
      if (!log) throw new HttpError(404, "Reading plan not found");
      return json(log, 201);
    },
  },
  {
    method: "PATCH", path: /^\/api\/logs\/([^/]+)$/,
    async run({ request, env, user, params: [id] }) {
      const log = await store.updateLog(env.DB, user, id, await readBody(request, logChanges));
      if (!log) throw notFound();
      return json(log);
    },
  },
  {
    method: "DELETE", path: /^\/api\/logs\/([^/]+)$/,
    async run({ env, user, params: [id] }) {
      if (!(await store.deleteLog(env.DB, user, id))) throw notFound();
      return json({ ok: true });
    },
  },

  {
    method: "GET", path: /^\/api\/profile$/,
    async run({ env, user }) {
      return json(await store.getProfile(env.DB, user));
    },
  },
  {
    method: "PATCH", path: /^\/api\/profile$/,
    async run({ request, env, user }) {
      return json(await store.updateProfile(env.DB, user, await readBody(request, profileChanges)));
    },
  },

  {
    method: "DELETE", path: /^\/api\/account$/,
    async run({ env, user }) {
      await store.deleteAccount(env.DB, user);
      return json({ ok: true });
    },
  },
];

/* `whoIs` finds the signed-in user's id (tests pass their own). */
export async function handleApi(request: Request, env: Env, whoIs = getUserId): Promise<Response> {
  const url = new URL(request.url);
  const matches = routes.map((r) => ({ r, m: r.path.exec(url.pathname) })).filter((x) => x.m);
  if (!matches.length) return fail(404, "Not found");
  const hit = matches.find((x) => x.r.method === request.method);
  if (!hit) return json({ error: "Method not allowed" }, 405, { allow: matches.map((x) => x.r.method).join(", ") });
  // Changes only from the app's own pages (on top of the sign-in cookie being same-site).
  const origin = request.headers.get("origin");
  if (request.method !== "GET" && origin && origin !== new URL(env.BETTER_AUTH_URL).origin)
    return fail(403, "Not allowed from this site");
  try {
    let user = "";
    if (hit.r.auth !== false) {
      user = (await whoIs(request, env)) ?? "";
      if (!user) return fail(401, "Sign in required");
    }
    return await hit.r.run({ request, env, user, params: hit.m!.slice(1).map(decodeURIComponent) });
  } catch (e) {
    if (e instanceof HttpError) return fail(e.status, e.message, e.extra);
    if (e instanceof URIError) return fail(400, "Bad URL");
    console.error(e);
    return fail(500, "Something went wrong");
  }
}
