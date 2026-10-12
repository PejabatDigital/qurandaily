import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchSolatMonth, formatPrayerTime, SolatUnavailableError, zoneByCode } from "@/lib/solat";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchSolatMonth", () => {
  it("requests the given zone, year and month", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ prayers: [] })));
    vi.stubGlobal("fetch", fetchMock);
    await fetchSolatMonth("SGR01", 2027, 3);
    expect(fetchMock).toHaveBeenCalledWith("https://api.waktusolat.app/v2/solat/SGR01?year=2027&month=3");
  });

  it("reports a month the API has no data for as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));
    await expect(fetchSolatMonth("WLY01", 2099, 1)).rejects.toBeInstanceOf(SolatUnavailableError);
  });

  it("reports other failures as errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
    const error = await fetchSolatMonth("WLY01", 2026, 1).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(SolatUnavailableError);
  });
});

describe("formatPrayerTime", () => {
  it("formats in Malaysia time regardless of the device time zone", () => {
    // 2026-01-01T05:58:00+08:00
    expect(formatPrayerTime(Date.UTC(2025, 11, 31, 21, 58) / 1000)).toBe("05:58");
  });
});

describe("zoneByCode", () => {
  it("finds a zone or returns undefined", () => {
    expect(zoneByCode("WLY01")?.negeri).toBe("Wilayah Persekutuan");
    expect(zoneByCode("XXX99")).toBeUndefined();
  });
});
