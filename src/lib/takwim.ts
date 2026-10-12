import {
  TAKWIM_SOURCES, DAY_CODES, HIJRI_MONTHS, HIJRI_MONTH_ORDER, MONTHS_EN, MONTHS_MS, MONTHS_SHORT,
  type DayEntry, type HijriMonthCode, type TakwimYearSource,
} from "@/data/takwim";

/** A Gregorian year of Takwim data, expanded to one entry per day. */
export type TakwimYear = {
  year: number;
  /** days[month][day], both 0-indexed. */
  days: DayEntry[][];
  /** Day of week (0 = Sunday) of the 1st of each month. */
  firstDow: number[];
};

/** A day in the Takwim: Gregorian year, 0-indexed month and day. */
export type TakwimDay = { year: number; m: number; d: number };

/** A Gregorian month: year plus 0-indexed month. */
export type MonthCursor = { year: number; m: number };

const pad = (n: number) => String(n).padStart(2, "0");

export function buildTakwimYear(src: TakwimYearSource): TakwimYear {
  const { year } = src;
  const starts = new Map(src.monthStarts.map(([md, code, hy]) => [md, { code, hy }]));
  let [hDay, hMonth, hYear] = src.jan1;
  const days: DayEntry[][] = [];
  const firstDow: number[] = [];

  for (let m = 0; m < 12; m++) {
    const length = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
    const dow = new Date(Date.UTC(year, m, 1)).getUTCDay();
    firstDow.push(dow);
    const month: DayEntry[] = [];
    for (let d = 0; d < length; d++) {
      if (m > 0 || d > 0) {
        const start = starts.get(`${pad(m + 1)}-${pad(d + 1)}`);
        if (start) {
          const expected = HIJRI_MONTH_ORDER[(HIJRI_MONTH_ORDER.indexOf(hMonth) + 1) % 12];
          if (start.code !== expected) {
            throw new Error(`Takwim ${year}: ${start.code} on ${pad(m + 1)}-${pad(d + 1)} should be ${expected}`);
          }
          hDay = 1;
          hMonth = start.code;
          hYear = start.hy;
        } else if (++hDay > 30) {
          throw new Error(`Takwim ${year}: ${hMonth} ${hYear} runs past 30 days`);
        }
      }
      month.push([hDay, hMonth, hYear, DAY_CODES[(dow + d) % 7]]);
    }
    days.push(month);
  }
  return { year, days, firstDow };
}

const YEARS = new Map(TAKWIM_SOURCES.map((src) => [src.year, buildTakwimYear(src)]));

/** Years with Takwim data, ascending. */
export const TAKWIM_YEARS: number[] = [...YEARS.keys()].sort((a, b) => a - b);

export function getTakwimYear(year: number): TakwimYear | null {
  return YEARS.get(year) ?? null;
}

export function getDayEntry({ year, m, d }: TakwimDay): DayEntry | null {
  return YEARS.get(year)?.days[m]?.[d] ?? null;
}

export function isNewHijriMonth(t: TakwimYear, mIdx: number, dIdx: number): boolean {
  const cur = t.days[mIdx][dIdx];
  if (dIdx === 0) return cur[0] === 1;
  return cur[1] !== t.days[mIdx][dIdx - 1][1];
}

export function hijriRangeLabel(t: TakwimYear, mIdx: number): string {
  const data = t.days[mIdx];
  const last = data.length - 1;
  const startHm = data[0][1], endHm = data[last][1];
  const startHy = data[0][2], endHy = data[last][2];
  let label = `${HIJRI_MONTHS[startHm]} ${startHy}`;
  if (startHm !== endHm) label += ` – ${HIJRI_MONTHS[endHm]} ${endHy}`;
  return label;
}

export type SearchHit = { m: number; d: number };

export function searchGregorian(t: TakwimYear, query: string, fallbackM: number): SearchHit | null {
  const val = query.trim().toLowerCase();
  if (!val) return null;
  const ms = MONTHS_MS.map((m) => m.toLowerCase());
  const en = MONTHS_EN.map((m) => m.toLowerCase());
  const sh = MONTHS_SHORT.map((m) => m.toLowerCase());
  let foundM = -1, foundD = -1;
  for (let i = 0; i < 12; i++) {
    if (val.includes(ms[i]) || val.includes(en[i]) || val.includes(sh[i])) {
      foundM = i;
      const num = val.match(/\d+/);
      if (num) foundD = parseInt(num[0]) - 1;
      break;
    }
  }
  if (foundM === -1) {
    const n = parseInt(val);
    if (!isNaN(n)) { foundD = n - 1; foundM = fallbackM; }
  }
  if (foundM >= 0 && foundD >= 0 && foundD < t.days[foundM].length) {
    return { m: foundM, d: foundD };
  }
  return null;
}

export function searchHijri(t: TakwimYear, query: string): SearchHit | null {
  const val = query.trim().toLowerCase();
  if (!val) return null;
  const codes = Object.keys(HIJRI_MONTHS) as HijriMonthCode[];
  let foundKey: HijriMonthCode | null = null;
  for (const code of codes) {
    if (val.includes(HIJRI_MONTHS[code].toLowerCase()) || val.includes(code.toLowerCase())) {
      foundKey = code; break;
    }
  }
  if (!foundKey) return null;
  const num = val.match(/\d+/);
  const day = num ? parseInt(num[0]) : 1;
  for (let m = 0; m < 12; m++) {
    for (let d = 0; d < t.days[m].length; d++) {
      const [hD, hM] = t.days[m][d];
      if (hM === foundKey && hD === day) return { m, d };
    }
  }
  return null;
}

/** Today's position in the Takwim, or null if there is no data for this year. */
export function todayInTakwim(now: Date = new Date()): TakwimDay | null {
  const day = { year: now.getFullYear(), m: now.getMonth(), d: now.getDate() - 1 };
  return getDayEntry(day) ? day : null;
}

/**
 * The last day of the current or next Ramadan on or after `from`: the day
 * before the first 1 Syawal after `from`, read from the Takwim data. Null if
 * the data doesn't reach that far.
 */
export function endOfRamadan(from: Date = new Date()): Date | null {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (const year of TAKWIM_YEARS) {
    if (year < today.getFullYear()) continue;
    const { days } = YEARS.get(year)!;
    for (let m = 0; m < 12; m++) {
      for (let d = 0; d < days[m].length; d++) {
        const [hDay, hMonth] = days[m][d];
        // new Date(y, m, d) is the day before (y, m, d + 1), even across months.
        if (hDay === 1 && hMonth === "SYW" && new Date(year, m, d + 1) > today) {
          return new Date(year, m, d);
        }
      }
    }
  }
  return null;
}

/**
 * The month before (delta -1) or after (delta 1) `cur`, staying within
 * `years` (ascending) and skipping any years missing from it. Returns null
 * at either end.
 */
export function stepMonth(cur: MonthCursor, delta: 1 | -1, years: number[]): MonthCursor | null {
  const m = cur.m + delta;
  if (m >= 0 && m <= 11) return { year: cur.year, m };
  const year = delta > 0
    ? years.find((y) => y > cur.year)
    : [...years].reverse().find((y) => y < cur.year);
  if (year === undefined) return null;
  return { year, m: delta > 0 ? 0 : 11 };
}
