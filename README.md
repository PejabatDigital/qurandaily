# Quran Daily

A minimalist Quran reading progress tracker. Set a reading campaign (goal + deadline), log your daily pages, and track your streak and pace — plus a Malaysia-focused prayer times / Hijri calendar (Takwim) view.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui (Radix primitives)
- Supabase (Postgres, Auth, Row Level Security)
- TanStack Query
- Vitest for tests

## Getting started

Requires Node.js (v18+) and npm.

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

The publishable/anon key is safe to expose client-side — access is enforced by the Row Level Security policies defined in `supabase/migrations`.

### Database

SQL migrations live in `supabase/migrations/`. Apply them to your Supabase project via the [Supabase CLI](https://supabase.com/docs/guides/cli) or by running them in the SQL editor in order.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm run test` — run the test suite once
- `npm run test:watch` — run tests in watch mode
