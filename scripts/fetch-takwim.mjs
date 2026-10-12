#!/usr/bin/env node
// Generates src/data/takwim/<year>.ts from JAKIM's official e-Solat service
// (www.e-solat.gov.my), whose daily prayer timetable carries JAKIM's Hijri
// date for every day. Hijri dates are national, so one zone is enough.
//
// Usage: npm run takwim:fetch -- 2028
// Then add the new file to TAKWIM_SOURCES in src/data/takwim/index.ts.
import { writeFile } from "node:fs/promises";

const MONTHS = ["MUH", "SAF", "RAW", "RAK", "JAW", "JAK", "REJ", "SYB", "RAM", "SYW", "ZKH", "ZHJ"];
const ZONE = "WLY01";

const year = Number(process.argv[2]);
if (!Number.isInteger(year) || year < 2000 || year > 2100) {
  console.error("Usage: npm run takwim:fetch -- <year>");
  process.exit(1);
}

const res = await fetch(
  `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=duration&zone=${ZONE}`,
  { method: "POST", body: new URLSearchParams({ datestart: `${year}-01-01`, dateend: `${year}-12-31` }) },
);
if (!res.ok) throw new Error(`e-Solat responded ${res.status}`);
const body = await res.json();
const days = body.prayerTime;
const expected = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
if (!Array.isArray(days) || days.length !== expected) {
  console.error(`JAKIM has not published a full ${year} timetable yet (status: ${body.status}).`);
  process.exit(1);
}

const parse = (hijri) => {
  const [y, m, d] = hijri.split("-").map(Number);
  return [d, MONTHS[m - 1], y];
};
const pad = (n) => String(n).padStart(2, "0");

const jan1 = parse(days[0].hijri);
const starts = [];
days.forEach((day, i) => {
  const [d, code, hy] = parse(day.hijri);
  if (i > 0 && d === 1) {
    const date = new Date(Date.UTC(year, 0, 1 + i));
    starts.push(`    ["${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}", "${code}", ${hy}],`);
  }
});

const today = new Date().toISOString().slice(0, 10);
const file = `import type { TakwimYearSource } from "./types";

const takwim${year}: TakwimYearSource = {
  year: ${year},
  source: "JAKIM e-Solat (www.e-solat.gov.my), fetched ${today}",
  jan1: [${jan1[0]}, "${jan1[1]}", ${jan1[2]}],
  monthStarts: [
${starts.join("\n")}
  ],
};

export default takwim${year};
`;

const out = new URL(`../src/data/takwim/${year}.ts`, import.meta.url);
await writeFile(out, file);
console.log(`Wrote src/data/takwim/${year}.ts (${starts.length} Hijri month starts).`);
