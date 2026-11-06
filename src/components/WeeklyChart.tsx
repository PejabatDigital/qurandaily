import { useEffect, useRef, useState, type PointerEvent } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SegmentedControl from "@/components/SegmentedControl";
import type { ActivityDay } from "@/lib/activity";
import { dayAt, labelledDays, pageTicks } from "@/lib/chart";

type Range = "7" | "30" | "all";

const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "7D" },
  { value: "30", label: "30D" },
  { value: "all", label: "All" },
];

const HEIGHT = 180;
const PAD = { top: 20, right: 12, bottom: 24, left: 28 };

interface WeeklyChartProps {
  /** Every day of the reading plan, oldest first. */
  activity: ActivityDay[];
}

/** Pages read each day, drawn by the app itself (no chart library), in Clear day colours:
 *  an accent-blue line on hairline gridlines. A week shows each day's pages; longer
 *  ranges show a day's pages when you touch or point at it. */
const WeeklyChart = ({ activity }: WeeklyChartProps) => {
  const [range, setRange] = useState<Range>("7");
  const [active, setActive] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const shown = range === "all" ? activity : activity.slice(-Number(range));
  const days = shown.length;
  const week = days <= 7;
  const ticks = pageTicks(Math.max(0, ...shown.map((a) => a.pages)));
  const top = ticks[ticks.length - 1];

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (days <= 1 ? plotW / 2 : (i / (days - 1)) * plotW);
  const y = (pages: number) => PAD.top + plotH - (pages / top) * plotH;
  const line = shown.map((a, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(a.pages).toFixed(1)}`).join("");

  const total = shown.reduce((n, a) => n + a.pages, 0);
  const point = active !== null && active < days ? shown[active] : null;

  const track = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActive(dayAt(e.clientX - rect.left - PAD.left, plotW, days));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 p-5 pb-2">
        <CardTitle className="text-heading font-semibold">Reading activity</CardTitle>
        <SegmentedControl
          label="Range"
          value={range}
          onChange={(r) => {
            setRange(r);
            setActive(null);
          }}
          options={RANGES}
          className="shrink-0 [&>button]:px-3"
        />
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <p className="h-[18px] text-small text-muted-foreground" aria-live="polite">
          {point
            ? `${format(point.date, "EEE d MMM")} · ${point.pages} page${point.pages === 1 ? "" : "s"}`
            : `${total} page${total === 1 ? "" : "s"} in ${days} day${days === 1 ? "" : "s"}`}
        </p>
        <div ref={boxRef} className="mt-2">
          <svg
            width={width}
            height={HEIGHT}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            role="img"
            aria-label={`Pages read each day: ${total} pages in ${days} days`}
            className="block touch-pan-y select-none"
            onPointerMove={week ? undefined : track}
            onPointerDown={week ? undefined : track}
            onPointerLeave={() => setActive(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  className="stroke-border"
                  strokeWidth={1}
                />
                <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[12px]">
                  {t}
                </text>
              </g>
            ))}

            {labelledDays(days, 5).map((i) => (
              <text
                key={i}
                // Kept clear of the card's edges so the first and last dates fit.
                x={week ? x(i) : Math.min(width - PAD.right - 16, Math.max(PAD.left + 16, x(i)))}
                y={HEIGHT - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[12px]"
              >
                {format(shown[i].date, week ? "EEE" : "d MMM")}
              </text>
            ))}

            {point && active !== null && (
              <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} className="stroke-faint" strokeWidth={1} />
            )}

            <path
              d={line}
              fill="none"
              className="stroke-primary"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {week &&
              shown.map((a, i) => (
                <g key={i}>
                  <circle cx={x(i)} cy={y(a.pages)} r={4} className="fill-card stroke-primary" strokeWidth={2.5} />
                  {a.pages > 0 && (
                    <text
                      x={x(i)}
                      y={y(a.pages) - 9}
                      textAnchor="middle"
                      className="fill-foreground text-[12px] font-semibold"
                    >
                      {a.pages}
                    </text>
                  )}
                </g>
              ))}

            {!week && point && active !== null && (
              <circle cx={x(active)} cy={y(point.pages)} r={4.5} className="fill-card stroke-primary" strokeWidth={2.5} />
            )}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyChart;
