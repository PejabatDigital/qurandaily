import {
  RAW, DAYS_IN_MONTH, HIJRI_MONTHS, MONTHS_EN, MONTHS_MS, MONTHS_SHORT,
  type HijriMonthCode,
} from "@/data/takwim2026";

export function isNewHijriMonth(mIdx: number, dIdx: number): boolean {
  const cur = RAW[mIdx][dIdx];
  if (dIdx === 0) return cur[0] === 1;
  return cur[1] !== RAW[mIdx][dIdx - 1][1];
}

export function hijriRangeLabel(mIdx: number): string {
  const data = RAW[mIdx];
  const last = data.length - 1;
  const startHm = data[0][1], endHm = data[last][1];
  const startHy = data[0][2], endHy = data[last][2];
  let label = `${HIJRI_MONTHS[startHm]} ${startHy}`;
  if (startHm !== endHm) label += ` – ${HIJRI_MONTHS[endHm]} ${endHy}`;
  return label;
}

export type SearchHit = { m: number; d: number };

export function searchGregorian(query: string, fallbackM: number): SearchHit | null {
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
  if (foundM >= 0 && foundD >= 0 && foundD < DAYS_IN_MONTH[foundM]) {
    return { m: foundM, d: foundD };
  }
  return null;
}

export function searchHijri(query: string): SearchHit | null {
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
    for (let d = 0; d < DAYS_IN_MONTH[m]; d++) {
      const [hD, hM] = RAW[m][d];
      if (hM === foundKey && hD === day) return { m, d };
    }
  }
  return null;
}

export function todayInTakwim(): { m: number; d: number } | null {
  const today = new Date();
  if (today.getFullYear() !== 2026) return null;
  const m = today.getMonth();
  const d = today.getDate() - 1;
  if (d < 0 || d >= RAW[m].length) return null;
  return { m, d };
}
