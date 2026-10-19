import { describe, it, expect, vi, afterEach } from "vitest";
import { ApiError, api, auth, setSignedOutHandler } from "@/lib/api";

const reply = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status, headers }));

const failure = (p: Promise<unknown>) => p.then(() => null, (e: ApiError) => e);

afterEach(() => {
  vi.restoreAllMocks();
  setSignedOutHandler(() => {});
});

describe("api", () => {
  it("passes on Better Auth's error code", async () => {
    reply(400, { code: "INVALID_OTP", message: "Invalid OTP" });
    const e = await failure(auth.signIn("a@example.com", "000000"));
    expect(e).toMatchObject({ status: 400, code: "INVALID_OTP" });
  });

  it("reads how long to wait, from our limit or Better Auth's", async () => {
    reply(429, { code: "TOO_SOON" }, { "retry-after": "40" });
    expect((await failure(auth.sendCode("a@example.com")))?.retryAfter).toBe(40);
    reply(429, { message: "Too many requests" }, { "x-retry-after": "12" });
    expect((await failure(auth.sendCode("a@example.com")))?.retryAfter).toBe(12);
  });

  it("notices when the session has ended", async () => {
    const signedOut = vi.fn();
    setSignedOutHandler(signedOut);
    reply(401, { error: "Sign in required" });
    await failure(api.campaigns());
    expect(signedOut).toHaveBeenCalled();
  });

  it("says when it can't connect", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await failure(api.logs())).toMatchObject({ status: 0, message: expect.stringMatching(/Couldn't connect/) });
  });
});
