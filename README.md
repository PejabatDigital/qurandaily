# Quran Daily

A minimalist Quran reading progress tracker. Set a reading plan (goal + finish date), log your daily pages, and track your streak and pace — plus a Malaysia-focused prayer times / Hijri calendar (Takwim) view.

Live at [qurandaily.kasahkod.cc](https://qurandaily.kasahkod.cc/). Decisions, design and what's next are in [CLAUDE.md](CLAUDE.md).

## User flow

1. **Sign in** (`src/pages/SignIn.tsx`). Everything except the privacy page needs an account. Anyone without a session sees the sign-in screen: enter an email, then the 6-digit code emailed to it (it lasts 10 minutes; a new one can be sent after a minute). A new email creates the account. You stay signed in for 60 days, renewed whenever the app is opened, and the same account works on every device.
2. **Set-up** (`src/components/onboarding/`). Anyone without a reading plan sees the welcome screen, then four steps: goal (full Quran, Juz Amma or a surah range), finish date (30/60 days, End of Ramadan from the JAKIM takwim, 1 year or a picked date, with a live pages-a-day estimate), starting page, and an optional name and prayer zone. "Start reading" creates the plan and opens home.
3. **Home** (`src/pages/Index.tsx`) shows today's date, Hijri date and next prayer, the plan's progress ring, and stats. Depending on the plan, it also shows:
   - **First log:** a "Today's reading" card until the first reading is logged.
   - **Catch-up:** a calm card when the reader is behind an even schedule, dismissable for the day.
   - **Plan ended:** a card to extend the finish date or start a new plan (set-up from the goal step).
4. **Logging** (the + button) is by count ("How many pages did you read?") or by page ("What is the last page you read?"). The first log on a plan opens a celebration sheet. Reaching 100% shows a full-screen "Khatam complete" (or "Reading plan complete") screen once per plan.
5. **Account** (Profile): display name, sign out, and delete account (type DELETE to confirm), which removes the account and everything in it. The privacy page is at `/privacy`.

Plans, logs, display name, prayer zone and which milestones have been shown are stored on the account. Only the catch-up card's "dismissed for today" is remembered per device.

A plan's position is the next page to read. Reading the plan's last page completes it. The daily target is `ceil(pages left at the start of today / days left including today)`, from `src/lib/plan.ts`. In the code, database and routes, reading plans are still called "campaigns".

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui (Radix primitives)
- TanStack Query
- Cloudflare Workers: one Worker serves the built app and the API under `/api` (`worker/`)
- Cloudflare D1 (SQLite) for data
- Better Auth for sign-in (email one-time codes), with emails sent through Resend
- Vitest for tests

## Getting started

Requires Node.js 22.12+ and npm.

```sh
npm install
cp .dev.vars.example .dev.vars   # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run db:migrate:local         # creates the local database in .wrangler/
npm run build                    # the Worker serves dist/
```

Then run these in two terminals:

```sh
npm run dev:api   # the Worker and its local database, on http://localhost:8787
npm run dev       # the app, on http://localhost:8080 (it forwards /api to the Worker)
```

Open http://localhost:8080. With `EMAIL_TO_CONSOLE=true` in `.dev.vars`, sign-in codes are printed in the `dev:api` terminal instead of being emailed.

### Settings and secrets

- `BETTER_AUTH_URL`: the site's address, in `wrangler.jsonc` (`http://localhost:8080` in `.dev.vars`).
- `BETTER_AUTH_SECRET`: signs sign-in sessions. A long random string.
- `RESEND_API_KEY`: sends the code emails, from `no-reply@kasahkod.cc` (replies go to `hello@kasahkod.cc`).

For the live site, secrets are set with `npx wrangler secret put <NAME>`. Locally they go in `.dev.vars`, which is git-ignored. Never commit them.

### How it fits together

- `worker/index.ts` sends `/api/auth/*` to Better Auth (only the routes the app uses), the rest of `/api/*` to the API, and everything else to the built app.
- `worker/api.ts` lists every API route. Each one, apart from `/api/health`, needs a signed-in user, and `worker/store.ts` scopes every query to that user's id, so no one can read or change another person's rows.
- Only one plan is active at a time: the API switches the others off, and the database refuses a second one.
- Sign-in limits are kept in D1, since a Worker's memory isn't shared between requests: Better Auth's per-address limits, 5 wrong guesses per code, and `worker/limits.ts` (one code a minute and five an hour per email).
- `src/lib/api.ts` is the app's side: the API calls and the sign-in calls. The session is a same-site cookie.

### Database

The schema is in `migrations/` (D1, SQLite): Better Auth's tables (`user`, `session`, `account`, `verification`, `rateLimit`), `email_sends` for the per-email limit, and the app's `profiles`, `campaigns` and `reading_logs`.

```sh
npm run db:migrate:local        # apply to the local database
npm run db:migrate:production   # apply to the live database
```

## Deployment

The Worker is configured in `wrangler.jsonc`: Wrangler uploads `./dist`, runs the Worker for `/api/*`, and serves `index.html` for other unknown paths (`not_found_handling: "single-page-application"`) so client-side routes work.

The first time:

1. `npx wrangler login`
2. `npx wrangler d1 create qurandaily-production`, then put the `database_id` it prints into `wrangler.jsonc`.
3. `npm run db:migrate:production`
4. `npx wrangler secret put BETTER_AUTH_SECRET` and `npx wrangler secret put RESEND_API_KEY`

Then, each time:

```sh
npm run deploy         # builds, then runs wrangler deploy
```

Use `npx wrangler deploy --dry-run` after a build to check the upload without publishing. After changing `wrangler.jsonc`, run `npm run cf-types` to refresh `worker-configuration.d.ts`.

## Takwim (Hijri calendar) data

Hijri dates come from JAKIM, one file per Gregorian year in `src/data/takwim/`. Each file stores the Hijri date on 1 January and the date each Hijri month begins; `src/lib/takwim.ts` expands and validates it. Years without a file show a "calendar not yet available" message.

To add a year once JAKIM publishes its timetable:

```sh
npm run takwim:fetch -- 2028
```

This writes `src/data/takwim/2028.ts` from JAKIM's e-Solat service. Add it to `TAKWIM_SOURCES` in `src/data/takwim/index.ts`, then run `npm run test` — the tests check the data is continuous and that gazetted holidays (add the new year's to `src/test/takwim.test.ts`) fall on the right days.

Prayer times are fetched at runtime from [api.waktusolat.app](https://api.waktusolat.app), which mirrors JAKIM's timetable.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build into `dist/`
- `npm run preview` — serve the production build locally (without the API; use `dev:api` for that)
- `npm run dev:api` — run the Worker and its local database
- `npm run deploy` — build and deploy to Cloudflare
- `npm run db:migrate:local` / `npm run db:migrate:production` — apply database migrations
- `npm run typecheck` — type-check the Worker and the app
- `npm run cf-types` — regenerate the Worker's types after changing `wrangler.jsonc`
- `npm run lint` — run ESLint
- `npm run test` — run the test suite once
- `npm run test:watch` — run tests in watch mode
- `npm run takwim:fetch -- <year>` — generate a year of Takwim data from JAKIM
