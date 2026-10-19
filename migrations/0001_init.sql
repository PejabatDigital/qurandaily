-- Quran Daily schema v1 (Cloudflare D1).
-- Every app row belongs to one user; the API (worker/api.ts) only ever reads or writes
-- the signed-in user's rows. Reading plans are still called "campaigns" here.

-- Sign-in tables for Better Auth (email one-time codes). Column names and types match
-- Better Auth 1.7's schema for SQLite.

CREATE TABLE "user" (
  "id"            text    NOT NULL PRIMARY KEY,
  "name"          text    NOT NULL,
  "email"         text    NOT NULL UNIQUE,
  "emailVerified" integer NOT NULL,
  "image"         text,
  "createdAt"     date    NOT NULL,
  "updatedAt"     date    NOT NULL
);

-- ipAddress and userAgent are left empty (worker/auth.ts): we don't keep them.
CREATE TABLE "session" (
  "id"        text NOT NULL PRIMARY KEY,
  "expiresAt" date NOT NULL,
  "token"     text NOT NULL UNIQUE,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId"    text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);
CREATE INDEX "session_userId_idx" ON "session" ("userId");

-- Required by Better Auth's schema; email codes don't store anything in it.
CREATE TABLE "account" (
  "id"                    text NOT NULL PRIMARY KEY,
  "accountId"             text NOT NULL,
  "providerId"            text NOT NULL,
  "userId"                text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  date,
  "refreshTokenExpiresAt" date,
  "scope"                 text,
  "password"              text,
  "createdAt"             date NOT NULL,
  "updatedAt"             date NOT NULL
);
CREATE INDEX "account_userId_idx" ON "account" ("userId");

-- Short-lived values: the sign-in codes (stored scrambled) and their wrong-guess count.
CREATE TABLE "verification" (
  "id"         text NOT NULL PRIMARY KEY,
  "identifier" text NOT NULL,
  "value"      text NOT NULL,
  "expiresAt"  date NOT NULL,
  "createdAt"  date NOT NULL,
  "updatedAt"  date NOT NULL
);
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");

-- Better Auth's request limits per internet address, kept here because a Worker's
-- memory isn't shared between requests.
CREATE TABLE "rateLimit" (
  "id"          text    NOT NULL PRIMARY KEY,
  "key"         text    NOT NULL UNIQUE,
  "count"       integer NOT NULL,
  "lastRequest" bigint  NOT NULL
);

-- Our own per-email limit on sending codes (worker/limits.ts). Holds a SHA-256 of the
-- email, not the email itself; rows older than an hour are removed.
CREATE TABLE email_sends (
  email_hash TEXT    NOT NULL,
  sent_at    INTEGER NOT NULL  -- milliseconds since 1970
);
CREATE INDEX email_sends_by_email ON email_sends (email_hash, sent_at);

-- App tables. Times are ISO strings in UTC; dates are YYYY-MM-DD in the reader's own
-- time zone (the app sends them).

-- One per user, created with the account (worker/auth.ts).
CREATE TABLE profiles (
  user_id      TEXT NOT NULL PRIMARY KEY REFERENCES "user" ("id") ON DELETE CASCADE,
  display_name TEXT,
  prayer_zone  TEXT,           -- JAKIM zone code, e.g. WLY01
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- Reading plans.
CREATE TABLE campaigns (
  id               TEXT    NOT NULL PRIMARY KEY,
  user_id          TEXT    NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  title            TEXT    NOT NULL,
  start_page       INTEGER NOT NULL,
  end_page         INTEGER NOT NULL,
  start_date       TEXT    NOT NULL,
  end_date         TEXT    NOT NULL,
  is_active        INTEGER NOT NULL DEFAULT 0,     -- 0 or 1
  milestones_shown TEXT    NOT NULL DEFAULT '[]',  -- JSON list of milestone keys already shown
  created_at       TEXT    NOT NULL,
  updated_at       TEXT    NOT NULL
);
CREATE INDEX campaigns_by_user ON campaigns (user_id, created_at);
-- At most one active plan per user. The API also switches the others off first.
CREATE UNIQUE INDEX campaigns_one_active ON campaigns (user_id) WHERE is_active = 1;

CREATE TABLE reading_logs (
  id                  TEXT    NOT NULL PRIMARY KEY,
  campaign_id         TEXT    NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  user_id             TEXT    NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  pages_read          INTEGER NOT NULL,
  current_page_marker INTEGER NOT NULL,  -- the next page to read after this log
  created_at          TEXT    NOT NULL
);
CREATE INDEX reading_logs_by_user ON reading_logs (user_id, created_at);
CREATE INDEX reading_logs_by_campaign ON reading_logs (campaign_id);
