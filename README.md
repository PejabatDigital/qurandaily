# Quran Daily

A minimalist Quran reading progress tracker. Set a reading plan (goal + finish date), log your daily pages, and track your streak and pace — plus a Malaysia-focused prayer times / Hijri calendar (Takwim) view.

Live at [qurandaily.kasahkod.cc](https://qurandaily.kasahkod.cc/).

## User flow

1. **Sign-in is silent.** Each browser gets an anonymous Supabase session, so there's no sign-up. Progress is saved per device and browser.
2. **Set-up** (`src/components/onboarding/`). Anyone without a reading plan on this device sees the welcome screen, then four steps: goal (full Quran, Juz Amma or a surah range), finish date (30/60 days, End of Ramadan from the JAKIM takwim, 1 year or a picked date, with a live pages-a-day estimate), starting page, and an optional name and prayer zone. "Start reading" creates the plan and opens home.
3. **Home** (`src/pages/Index.tsx`) shows today's date, Hijri date and next prayer, the plan's progress ring, and stats. Depending on the plan, it also shows:
   - **First log:** a "Today's reading" card until the first reading is logged.
   - **Catch-up:** a calm card when the reader is behind an even schedule, dismissable for the day.
   - **Plan ended:** a card to extend the finish date or start a new plan (set-up from the goal step).
4. **Logging** (the + button) is by count ("How many pages did you read?") or by page ("What is the last page you read?"). The first log on a plan opens a celebration sheet. Reaching 100% shows a full-screen "Khatam complete" (or "Reading plan complete") screen once per plan.

A plan's position is the next page to read. Reading the plan's last page completes it. The daily target is `ceil(pages left at the start of today / days left including today)`, from `src/lib/plan.ts`. In the code, database and routes, reading plans are still called "campaigns".

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui (Radix primitives)
- Supabase (Postgres, Auth, Row Level Security)
- TanStack Query
- Vitest for tests
- Cloudflare Workers (static assets) for hosting

## Getting started

Requires Node.js 22.12+ and npm.

```sh
npm install
cp .env.example .env   # then fill in your Supabase project values
npm run dev
```

The app runs at `http://localhost:8080`.

### Environment variables

Create a Supabase project and set the following in `.env` (see `.env.example`):

```
VITE_SUPABASE_PROJECT_ID="..."
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="..."
```

These are read at build time, so they must be set wherever `npm run build` runs. The publishable/anon key is safe to expose client-side — access is enforced by the Row Level Security policies defined in `supabase/migrations`.

### Database

SQL migrations live in `supabase/migrations/`. Apply them to your Supabase project via the [Supabase CLI](https://supabase.com/docs/guides/cli) or by running them in the SQL editor in order.

## Deployment

The site is deployed to Cloudflare Workers as static assets, configured in `wrangler.jsonc`: Wrangler uploads `./dist` and serves `index.html` for unknown paths (`not_found_handling: "single-page-application"`) so client-side routes work.

```sh
npx wrangler login     # once
npm run deploy         # builds, then runs wrangler deploy
```

Use `npx wrangler deploy --dry-run` after a build to check the upload without publishing.

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
- `npm run preview` — serve the production build locally
- `npm run deploy` — build and deploy to Cloudflare
- `npm run lint` — run ESLint
- `npm run test` — run the test suite once
- `npm run test:watch` — run tests in watch mode
- `npm run takwim:fetch -- <year>` — generate a year of Takwim data from JAKIM
