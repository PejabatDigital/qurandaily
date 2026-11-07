import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchSolatMonth, formatPrayerTime, nextPrayer, SolatUnavailableError, weekAhead, zoneByCode, type DayPrayer } from "@/lib/solat";

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

describe("nextPrayer", () => {
  // 7 Nov 2026 in Kuala Lumpur (UTC+8), as unix seconds.
  const at = (h: number, m: number) => Date.UTC(2026, 10, 7, h - 8, m) / 1000;
  const day: DayPrayer = {
    day: 7, hijri: "1448-05-27",
    fajr: at(5, 48), syuruk: at(7, 0), dhuhr: at(12, 59), asr: at(16, 21), maghrib: at(18, 57), isha: at(20, 7),
  };

  it("finds the next prayer, skipping Syuruk", () => {
    expect(nextPrayer(day, at(4, 0))?.label).toBe("Subuh");
    expect(nextPrayer(day, at(6, 30))?.label).toBe("Zohor");
    expect(nextPrayer(day, at(15, 44))).toEqual({ key: "asr", label: "Asar", unix: at(16, 21) });
  });

  it("returns null once Isyak has passed", () => {
    expect(nextPrayer(day, at(20, 7))).toBeNull();
    expect(nextPrayer(day, at(23, 0))).toBeNull();
  });
});

describe("weekAhead", () => {
  it("gives today and the six days after it", () => {
    const days = weekAhead(new Date(2026, 10, 7, 15, 30));
    expect(days.map((d) => d.day)).toEqual([7, 8, 9, 10, 11, 12, 13]);
    expect(days.every((d) => d.year === 2026 && d.month === 11)).toBe(true);
  });

  it("runs into the next month and the next year", () => {
    const days = weekAhead(new Date(2026, 11, 28));
    expect(days.map((d) => `${d.year}-${d.month}-${d.day}`)).toEqual([
      "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-1-1", "2027-1-2", "2027-1-3",
    ]);
  });
});
