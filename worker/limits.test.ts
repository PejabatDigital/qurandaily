import { describe, expect, it } from "vitest";
import { CODES_PER_HOUR, RESEND_WAIT_SECONDS } from "../src/lib/sign-in-rules";
import { takeCodeSend } from "./limits";
import { createD1 } from "./test/d1";

const MIN = 60_000;

describe("per-email code limit", () => {
  it("allows one code a minute", async () => {
    const db = createD1() as unknown as D1Database;
    const t = Date.UTC(2026, 9, 19, 12);
    expect(await takeCodeSend(db, "a@example.com", t)).toBe(0);
    expect(await takeCodeSend(db, "a@example.com", t + 10_000)).toBe(RESEND_WAIT_SECONDS - 10);
    expect(await takeCodeSend(db, "A@Example.com ", t + 10_000)).toBe(RESEND_WAIT_SECONDS - 10); // same inbox
    expect(await takeCodeSend(db, "b@example.com", t + 10_000)).toBe(0); // someone else
    expect(await takeCodeSend(db, "a@example.com", t + MIN)).toBe(0);
  });

  it(`allows ${CODES_PER_HOUR} codes an hour`, async () => {
    const db = createD1() as unknown as D1Database;
    const t = Date.UTC(2026, 9, 19, 12);
    for (let i = 0; i < CODES_PER_HOUR; i++) expect(await takeCodeSend(db, "a@example.com", t + i * MIN)).toBe(0);
    // The next is allowed an hour after the first.
    expect(await takeCodeSend(db, "a@example.com", t + CODES_PER_HOUR * MIN)).toBe(60 * 60 - CODES_PER_HOUR * 60);
    expect(await takeCodeSend(db, "a@example.com", t + 60 * MIN)).toBe(0);
  });

  it("doesn't keep the email itself, and forgets sends after an hour", async () => {
    const d1 = createD1();
    const t = Date.UTC(2026, 9, 19, 12);
    await takeCodeSend(d1 as unknown as D1Database, "a@example.com", t);
    const rows = d1.sqlite.prepare("SELECT * FROM email_sends").all() as { email_hash: string }[];
    expect(rows[0].email_hash).toMatch(/^[0-9a-f]{64}$/);
    await takeCodeSend(d1 as unknown as D1Database, "b@example.com", t + 61 * MIN);
    expect(d1.sqlite.prepare("SELECT COUNT(*) AS n FROM email_sends").get()).toEqual({ n: 1 });
  });
});
