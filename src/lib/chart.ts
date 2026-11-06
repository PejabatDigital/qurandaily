// Maths for the Reading activity chart (components/WeeklyChart.tsx), drawn by Quran Daily
// itself rather than a chart library.

/** Whole-number steps for the page axis: 0 up to at least `max`, about `count` steps of
 *  1, 2 or 5 × 10ⁿ pages. An empty chart still gets a 0–4 axis. */
export function pageTicks(max: number, count = 4): number[] {
  const top = Math.max(max, count);
  const rough = top / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  const whole = Math.max(1, Math.round(step));
  const ticks: number[] = [];
  for (let v = 0; v < top + whole; v += whole) {
    ticks.push(v);
    if (v >= top) break;
  }
  return ticks;
}

/** Which days get a date under the chart: every day when there are 7 or fewer, otherwise
 *  at most `count` evenly spaced, always including the last (today). */
export function labelledDays(days: number, count = 6): number[] {
  if (days <= 7) return Array.from({ length: days }, (_, i) => i);
  const every = Math.ceil(days / count);
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i -= every) out.unshift(i);
  return out;
}

/** The day nearest to `x` (0 to `width`) when `days` are spread evenly across it. */
export function dayAt(x: number, width: number, days: number): number {
  if (days <= 1 || width <= 0) return 0;
  return Math.min(days - 1, Math.max(0, Math.round((x / width) * (days - 1))));
}
