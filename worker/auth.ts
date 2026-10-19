/* Sign-in with a 6-digit email code (Better Auth's email OTP plugin), stored in D1.
   The routes the app uses live under /api/auth/* (see AUTH_ROUTES in index.ts):
   POST email-otp/send-verification-otp, sign-in/email-otp, sign-out; GET get-session.
   Signing in with a new email creates the account.

   Settings (wrangler.jsonc "vars", secrets via `wrangler secret put`, or .dev.vars locally):
   BETTER_AUTH_URL, and the secrets BETTER_AUTH_SECRET, RESEND_API_KEY. */
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins/email-otp";
import { CODE_MINUTES, WRONG_GUESSES } from "../src/lib/sign-in-rules";
import { sendCodeEmail } from "./email";

const DAY = 60 * 60 * 24;

function createAuth(env: Env) {
  return betterAuth({
    appName: "Quran Daily",
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: CODE_MINUTES * 60,
        allowedAttempts: WRONG_GUESSES,
        storeOTP: "hashed",
        sendVerificationOTP: ({ email, otp }) => sendCodeEmail(env, email, otp),
      }),
    ],
    // stay signed in for 60 days, renewed (at most daily) whenever the app is opened
    session: { expiresIn: 60 * DAY, updateAge: DAY },
    // Limits per internet address, kept in D1 since Worker memory isn't shared between
    // requests. Better Auth only switches them on by itself when it detects production,
    // so they're switched on here. The email plugin adds 3 a minute for sending codes;
    // signing in gets a little more room for mistyped codes.
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: { "/sign-in/email-otp": { window: 60, max: 10 } },
    },
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    databaseHooks: {
      // One profile per user, made with the account.
      user: {
        create: {
          after: async (user) => {
            const now = new Date().toISOString();
            await env.DB.prepare("INSERT OR IGNORE INTO profiles (user_id, created_at, updated_at) VALUES (?1, ?2, ?2)")
              .bind(user.id, now)
              .run();
          },
        },
      },
      // Sessions don't keep the internet address or browser details.
      session: {
        create: { before: async (session) => ({ data: { ...session, ipAddress: null, userAgent: null } }) },
      },
    },
    telemetry: { enabled: false },
  });
}

type Auth = ReturnType<typeof createAuth>;
const instances = new WeakMap<Env, Auth>(); // one Better Auth instance per Worker environment

export function getAuth(env: Env): Auth {
  let auth = instances.get(env);
  if (!auth) {
    auth = createAuth(env);
    instances.set(env, auth);
  }
  return auth;
}

/* The signed-in user's id, or null when signed out. */
export async function getUserId(request: Request, env: Env): Promise<string | null> {
  const session = await getAuth(env).api.getSession({ headers: request.headers });
  return session ? session.user.id : null;
}
