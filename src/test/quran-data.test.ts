import { describe, it, expect } from "vitest";
import {
  SURAHS, TOTAL_PAGES,
  getSurahForPage, getSurahNumberForPage, getStartPageForSurah, getEndPageForSurah,
} from "@/lib/quran-data";

describe("SURAHS", () => {
  it("lists all 114 surahs in order with non-decreasing start pages", () => {
    expect(SURAHS).toHaveLength(114);
    SURAHS.forEach((s, i) => {
      expect(s.number).toBe(i + 1);
      if (i > 0) expect(s.startPage).toBeGreaterThanOrEqual(SURAHS[i - 1].startPage);
      expect(s.startPage).toBeLessThanOrEqual(TOTAL_PAGES);
    });
  });
});

describe("getSurahForPage", () => {
  it("returns the surah that starts on or before the page", () => {
    expect(getSurahForPage(1)).toBe("Al-Fatihah");
    expect(getSurahForPage(2)).toBe("Al-Baqarah");
    expect(getSurahForPage(49)).toBe("Al-Baqarah");
    expect(getSurahForPage(50)).toBe("Aal-E-Imran");
  });

  it("picks the last surah starting on a shared page", () => {
    expect(getSurahForPage(604)).toBe("An-Nas");
  });

  it("falls back to Al-Fatihah for pages before 1", () => {
    expect(getSurahForPage(0)).toBe("Al-Fatihah");
  });
});

describe("getSurahNumberForPage", () => {
  it("returns the surah number as a string", () => {
    expect(getSurahNumberForPage(293)).toBe("18");
    expect(getSurahNumberForPage(562)).toBe("67");
    expect(getSurahNumberForPage(0)).toBe("1");
  });
});

describe("getStartPageForSurah / getEndPageForSurah", () => {
  it("returns the page range of a surah", () => {
    expect(getStartPageForSurah("2")).toBe(2);
    expect(getEndPageForSurah("2")).toBe(49);
    expect(getStartPageForSurah("18")).toBe(293);
    expect(getEndPageForSurah("18")).toBe(304);
  });

  it("ends the last surah on the final page", () => {
    expect(getEndPageForSurah("114")).toBe(TOTAL_PAGES);
  });

  it("defaults unknown surahs to page 1", () => {
    expect(getStartPageForSurah("999")).toBe(1);
  });
});
