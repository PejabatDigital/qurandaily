# Quran Daily — project brief for Claude Code

Quran Daily helps a reader finish the Quran (or part of it) by a date they choose: set a
reading plan, log pages each day, and see progress, pace and streak. It also shows today's
Hijri date and prayer times for Malaysia (Takwim). A Kasah Kod app, live at
**qurandaily.kasahkod.cc**, used by Amin every day. Brief written 6 Nov 2026.

## The concept
- A **reading plan** = a goal (full Quran, Juz Amma or a surah range) + a finish date.
  Only one plan is active at a time.
- Logging is quick: by count ("How many pages did you read?") or by page ("What is the
  last page you read?").
- Calm, not pushy: a gentle catch-up card when behind, milestone messages once per plan,
  a celebration for the first log and for finishing.
- Malaysia first: JAKIM Takwim (Hijri dates) and JAKIM prayer zones.
- Open to anyone: a new email creates an account (no closed sign-up, unlike WalletKu and
  KlienKu).
- `README.md` has the full user flow (sign-in → set-up → home → logging → account).

## Stack
- Frontend: **Vite + React + TypeScript**, Tailwind CSS + shadcn-ui (Radix), TanStack
  Query, date-fns. (QD is the only React app in the family; the others are vanilla JS.)
- One Cloudflare Worker serves the built app (`dist/`) and the API (`worker/`, `/api/*`).
  Config `wrangler.jsonc`. D1 database `qurandaily-production`. Every row belongs to a
  `user_id`.
- Sign-in: Better Auth, emailed 6-digit code, no passwords. Emails via Resend from
  no-reply@kasahkod.cc, replies to hello@kasahkod.cc. WalletKu copied this sign-in.
- Prayer times are fetched by the browser from api.waktusolat.app (mirrors JAKIM).
- Tests: Vitest — app tests in `src/test/`, API tests in `worker/*.test.ts` against an
  SQLite stand-in for D1 (`worker/test/d1.ts`).
- Cloudflare Workers free plan: 10 ms CPU per request. Keep Worker code light.
- `better-auth` and `zod` are pinned to exact versions on purpose.
- The GitHub repo `PejabatDigital/qurandaily` is **public**.

## How we work
- Amin is not a developer. Plain, simple English, short. After each step, say what
  changed, what he should see, and exactly what to test on his phone.
- Discuss before building. Ask rather than assume; give options with a recommendation.
- Work directly on `main`. No branches, no pull requests.
- **Deploying:** until automatic deploys are set up (step B below), the live site only
  changes when `npm run deploy` is run. Only deploy when Amin says so.
- One step at a time. Don't start the next one until Amin confirms the last one works.
- Don't reopen decisions already made, and don't add extras. **Ask before adding any
  library.**
- Before saying a step is done: `npm run typecheck`, `npm run lint`, `npm run test` and
  `npm run build` all pass. Keep the tests; add tests for any new plan maths.
- Commit messages: a plain sentence saying what changed for the reader, then a short body
  saying why.
- When Amin must do something himself (Cloudflare, accounts, keys), give numbered steps.
- Amin adds secrets himself and runs remote D1 migrations himself, before code that needs
  them goes live: `npm run db:migrate:production`.
- Secrets only in `wrangler secret` / git-ignored `.dev.vars`. The repo is public: never
  commit secrets, data exports, database dumps, or anyone's real reading data (including
  in tests or screenshots).
- Every API query is limited to the signed-in user's `user_id`, with no exceptions.
- The desktop app's browser pane can't register service workers: test offline and Add to
  Home Screen on a real iPhone.
- Keep this file current when a decision changes. `README.md` is for people (what it is,
  how to run it).

## Decisions so far
- **Words:** "reading plans" in the app; still "campaigns" in the code, database and
  routes. Don't rename them in the code.
- **Plan position** is the next page to read. Reading the plan's last page completes it.
- **Today's target** = `ceil(pages left at the start of today / days left including
  today)` (`src/lib/plan.ts`), so it doesn't drop as the reader logs during the day.
- **Editing a plan** keeps its exact pages. Start dates are saved as local dates.
- **Graph:** runs from the plan's start to today (stopping at the end date or the day it
  was finished), with 7D, 30D and All.
- **Celebrations:** a sheet after the first log on a plan; a full-screen "Khatam complete"
  (or "Reading plan complete" for part of the Quran) once per plan at 100%.
- **Milestones** (7/30/100-day streaks, 25/50/75%) show once per plan; which ones have
  shown is saved on the plan, so a new device doesn't replay them.
- **Catch-up card** "dismissed for today" is remembered per device only.
- **Every pop-up message** uses the app's own toasts, at the top. Errors are red.
- **Sign-in:** code lasts 10 minutes, 5 wrong guesses, codes stored hashed; one code a
  minute and five an hour per email (`worker/limits.ts`), plus Better Auth's limits per
  internet address, all kept in D1. Stay signed in 60 days, renewed when the app opens.
  Sessions keep no internet address or browser details. Only the four sign-in routes the
  app uses are open (`worker/index.ts`).
- **Changes** must come from the app's own pages (Origin check in `worker/api.ts`).
- **Account:** display name, prayer zone, sign out, delete account (type DELETE), which
  removes everything. Privacy page at `/privacy`.
- **Takwim** comes from JAKIM, one file per year in `src/data/takwim/`. Years without a
  file show "calendar not yet available".

## History
1. ✅ Moved from Lovable to a local project (28 Sep 2026).
2. ✅ Hosted on Cloudflare (1 Oct 2026).
3. ✅ Clean-up, year-aware Takwim with 2026 and 2027 data from JAKIM, tests (12 Oct 2026).
4. ✅ New set-up flow, home states (first log, catch-up, plan ended), log by count or by
   page, celebrations (12 Oct 2026).
5. ✅ New app icon and share image (13 Oct 2026).
6. ✅ Sign-in with an emailed code; data and sign-in moved from Supabase to Cloudflare D1
   and Better Auth; one account across devices (19 Oct 2026).
7. ✅ Family review against MyDay, WalletKu and KlienKu; `npm audit fix` (6 Nov 2026).

## Next steps
From the 6 Nov 2026 review, to bring QD in line with the other Kasah Kod apps.

**Decided 6 Nov 2026: QD moves to MyDay's "Clear day" look, exactly** (navy and blue,
Instrument Sans, same tokens, spacing, radii and light/dark, as WalletKu did), not QD's
green. **Restyle only:** same screens and behaviour; React, the logic and the tests stay.
Built from MyDay's Figma components (no new QD Figma screens first); Amin sees
screenshots along the way. **Goes live all at once** when every part is done (deploys are
still by hand, so `main` can hold unfinished work; don't deploy until Amin says so).

- ✅ **R1. Foundations** (built 6 Nov 2026; Amin to look). Clear day colours (light and
  dark), Instrument Sans served from `public/fonts/` (no Google Fonts), Appearance
  (System / Light / Dark, per device, as MyDay), and `public/_headers` like WalletKu's,
  with `connect-src` also allowing api.waktusolat.app.
- **R2. Shared pieces** (`src/components/ui/` and friends): buttons fully round, 48px
  fields, cards and lists with 16px corners and no borders, 24px sheets, toasts, tabs as
  a segmented control.
- **R3. Each screen:** sign-in, set-up, home, logging, history, plans, calendar, profile.
- **R4. Our own chart.** Draw the reading graph without a chart library, in Clear day
  colours (as WalletKu). Recharts is about 100 KB of the 160 KB the app downloads on every
  open.
- **R5. New app icon** in Clear day colours (needs Amin's design; the green ring stays
  until then).
- **R6. Amin checks it on his phone; then deploy.**
- Afterwards: **automatic deploys** (Workers Builds; add `routes` and `build.command` to
  `wrangler.jsonc`, Amin connects the repo in Cloudflare), then **opens offline** (service
  worker showing what this device last loaded, as WalletKu).
- **Maybe later (Amin to decide):** Download my data (CSV), D1 Time Travel restore steps in
  the README.

## Design — Clear day (as MyDay and WalletKu)
**Source of truth:** MyDay's Figma "MyDay — App Design"
https://www.figma.com/design/7HHfGaTye4sIoSabAMCsxT (Components page) and the token table
in `../../MyDay/MDsite/CLAUDE.md`. QD's own older Figma file (key `wTpm2pUiQgFeVAOj7DxXAH`)
holds the green look's welcome and set-up screens; use it for layout only.

**Direction:** modern and minimal. Navy and blue on a cool off-white; one typeface;
sentence case. Spacing 4/8/12/16/20/24/32/48, radius 12 (fields) / 16 (cards, lists) /
24 (sheets) / full (buttons), shadow only on floating things.

### Tokens (HSL channels in `src/index.css`, used through Tailwind)
QD keeps shadcn's token names so the components work unchanged; the values are Clear day's.
| QD token (Tailwind) | Clear day | Light | Dark |
| --- | --- | --- | --- |
| `--background` (`bg-background`) | `--bg` | #F6F7F9 | #0B1020 |
| `--card`, `--popover` | `--surface` | #FFFFFF | #131A2E |
| `--secondary`, `--muted`, `--accent`, `--subtle` | `--subtle` | #EEF1F6 | #1A2238 |
| `--accent-soft` (`bg-accent-soft`) | `--accent-soft` | #E8EEFF | #1A2550 |
| `--danger-soft` (`bg-danger-soft`) | `--danger-soft` | #FDECEC | #3A1A20 |
| `--foreground` | `--text` | #13204A | #E9ECF5 |
| `--muted-foreground` | `--text-muted` | #6B7389 | #8A93AB |
| `--faint` (`text-faint`) | `--text-subtle` | #9AA1B2 | #5D6680 |
| `--border`, `--input` | `--line` | #E4E7EE | #222B44 |
| `--primary`, `--ring` | `--accent` | #2E5BFF | #7B95FF |
| `--destructive` | `--danger` | #E5484D | #FF7A7D |
| `--primary-foreground` | `--on-accent` | #FFFFFF | #0B1020 |
| `--shadow` (`shadow-float`) | shadow | Add Bar, toasts | |

(shadcn's `--accent` is its hover fill, so it's `--subtle`; Clear day's accent blue is
`--primary`.) Dark follows the device, or Appearance in Profile (`qd:theme`, per device,
kept on sign-out; `public/theme.js` applies it before the page draws). Don't use Tailwind
`dark:` variants: the tokens switch.

**Type:** Instrument Sans (400, 500, 600; `font-bold` is 600), served from `public/fonts/`.
Arabic text (`font-arabic`) uses the device's own Arabic font, because Instrument Sans has
none.

**Security headers:** `public/_headers` (as WalletKu). Nothing loads from other sites
except prayer times from api.waktusolat.app (`connect-src`). Adding any other outside
address needs a change there.

**App icon (green, until R5):** a flat green ring, most of the way round, around an open book on cream.
`public/icon.svg` is the master; the PNGs and favicon are made from it with no
transparency. Don't redraw it in code. Share image `public/og-image.jpg`: 1200×630, under
100 KB (so WhatsApp shows it); bump `?v=` in `index.html` when it changes.

## Data
Tables in `migrations/0001_init.sql`: Better Auth's `user`, `session`, `account`,
`verification`, `rateLimit`; `email_sends` (per-email limit, email stored as a hash);
`profiles`, `campaigns`, `reading_logs`. Times are UTC ISO strings; dates are `YYYY-MM-DD`
in the reader's own time zone. New database changes go in a new numbered file. The API is
listed at the top of `worker/api.ts`.

## Yearly chore
Before each new year, add its Takwim once JAKIM publishes it: `npm run takwim:fetch --
<year>`, add it to `src/data/takwim/index.ts`, add that year's holidays to
`src/test/takwim.test.ts`, run the tests. **2028 is needed by the end of 2027.**

## The Kasah Kod family
Sibling apps on the same stack, for copying patterns:
- WalletKu `../../WalletKu/WKsite` (private repo): the most complete brief; `_headers`,
  Workers Builds, offline service worker, Appearance setting, Download my data.
- KlienKu `../../KlienKu/KKsite`: privacy + terms for Malaysia (PDPA), backups.
- MyDay `../../MyDay/MDsite` (public repo): offline sync, self-hosted fonts.
