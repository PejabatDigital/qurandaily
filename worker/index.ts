/* Quran Daily Worker: /api/auth/* is sign-in, the rest of /api/* is the API; everything
   else is the built app in dist/ (wrangler.jsonc routes only /api/* through this code). */
import { handleApi, json } from "./api";
import { getAuth } from "./auth";
import { takeCodeSend } from "./limits";

/* The only sign-in routes the app uses; Better Auth's others stay switched off. */
const AUTH_ROUTES: Record<string, string> = {
  "/api/auth/email-otp/send-verification-otp": "POST",
  "/api/auth/sign-in/email-otp": "POST",
  "/api/auth/sign-out": "POST",
  "/api/auth/get-session": "GET",
};

async function handleAuth(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (AUTH_ROUTES[path] !== request.method) return json({ error: "Not found" }, 404);

  if (path === "/api/auth/email-otp/send-verification-otp") {
    let body: { email?: unknown; type?: unknown };
    try {
      body = await request.clone().json();
    } catch {
      return json({ error: "Body must be JSON" }, 400);
    }
    if (body?.type !== "sign-in" || typeof body.email !== "string") return json({ error: "Invalid request" }, 400);
    const wait = await takeCodeSend(env.DB, body.email);
    if (wait) return json({ code: "TOO_SOON", message: "Please wait before asking for another code" }, 429, { "retry-after": String(wait) });
  }

  return getAuth(env).handler(request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/auth/")) return handleAuth(request, env);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
