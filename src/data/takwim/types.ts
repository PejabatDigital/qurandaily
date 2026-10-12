export type HijriMonthCode =
  | "MUH" | "SAF" | "RAW" | "RAK" | "JAW" | "JAK"
  | "REJ" | "SYB" | "RAM" | "SYW" | "ZKH" | "ZHJ";

/** Hijri months in calendar order, starting from Muharram. */
export const HIJRI_MONTH_ORDER: HijriMonthCode[] = [
  "MUH", "SAF", "RAW", "RAK", "JAW", "JAK",
  "REJ", "SYB", "RAM", "SYW", "ZKH", "ZHJ",
];

export type DayCode = "A" | "I" | "T" | "R" | "K" | "J" | "S";

/** [hijriDay, hijriMonthCode, hijriYear, dayCode] */
export type DayEntry = [number, HijriMonthCode, number, DayCode];

/** [hijriDay, hijriMonthCode, hijriYear] */
export type HijriDate = [number, HijriMonthCode, number];

/**
 * One Gregorian year of Takwim data. Hijri dates are continuous, so a year
 * is fully described by the Hijri date on 1 January plus the Gregorian date
 * on which each following Hijri month begins.
 */
export type TakwimYearSource = {
  year: number;
  /** Where the data came from, for anyone checking or updating it. */
  source: string;
  /** Hijri date on 1 January. */
  jan1: HijriDate;
  /** Each Hijri month beginning after 1 January: ["MM-DD", month, hijriYear]. */
  monthStarts: [string, HijriMonthCode, number][];
};
