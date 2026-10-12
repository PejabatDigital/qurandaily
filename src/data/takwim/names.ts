import type { DayCode, HijriMonthCode } from "./types";

export const HIJRI_MONTHS: Record<HijriMonthCode, string> = {
  REJ: "Rejab",        SYB: "Syaaban",     RAM: "Ramadan",
  SYW: "Syawal",       ZKH: "Zulkaedah",   ZHJ: "Zulhijjah",
  MUH: "Muharram",     SAF: "Safar",       RAW: "Rabiulawal",
  RAK: "Rabiulakhir",  JAW: "Jamadilawwal", JAK: "Jamadilakhir",
};

export const HIJRI_MONTHS_AR: Record<HijriMonthCode, string> = {
  REJ: "رَجَب",     SYB: "شَعْبَان",   RAM: "رَمَضَان",
  SYW: "شَوَّال",   ZKH: "ذُو الْقَعْدَة", ZHJ: "ذُو الْحِجَّة",
  MUH: "مُحَرَّم",  SAF: "صَفَر",       RAW: "رَبِيع الأَوَّل",
  RAK: "رَبِيع الآخِر", JAW: "جُمَادَى الأُولَى", JAK: "جُمَادَى الآخِرَة",
};

/** Indexed by JS day of week (0 = Sunday). */
export const DAY_CODES: DayCode[] = ["A", "I", "T", "R", "K", "J", "S"];

export const DAY_FULL: Record<DayCode, string> = {
  A: "Ahad", I: "Isnin", T: "Selasa", R: "Rabu",
  K: "Khamis", J: "Jumaat", S: "Sabtu",
};

export const DAY_EN: Record<DayCode, string> = {
  A: "Sunday", I: "Monday", T: "Tuesday", R: "Wednesday",
  K: "Thursday", J: "Friday", S: "Saturday",
};

export const MONTHS_EN = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
export const MONTHS_MS = [
  "Januari","Februari","Mac","April","Mei","Jun",
  "Julai","Ogos","September","Oktober","November","Disember",
];
export const MONTHS_SHORT = [
  "JAN","FEB","MAC","APR","MEI","JUN",
  "JUL","OGS","SEP","OKT","NOV","DIS",
];

export const DOW_SHORT = ["Ahd","Isn","Sel","Rab","Kha","Jum","Sab"];
