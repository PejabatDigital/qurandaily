// Takwim (Hijri-Gregorian calendar) data, one file per Gregorian year.
// To add a year, create ./<year>.ts and list it below.
import type { TakwimYearSource } from "./types";
import takwim2026 from "./2026";

export const TAKWIM_SOURCES: TakwimYearSource[] = [takwim2026];

export * from "./types";
export * from "./names";
