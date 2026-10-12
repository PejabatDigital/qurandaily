import { useEffect, useRef } from "react";
import { HIJRI_MONTHS } from "@/data/takwim";
import { isNewHijriMonth, todayInTakwim, type TakwimDay, type TakwimYear } from "@/lib/takwim";
import { cn } from "@/lib/utils";

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  takwim,
  m,
  highlight,
  onSelect,
}: {
  takwim: TakwimYear;
  m: number;
  highlight: TakwimDay | null;
  onSelect: (day: TakwimDay) => void;
}) {
  const { year } = takwim;
  const data = takwim.days[m];
  const firstDow = takwim.firstDow[m];
  const today = todayInTakwim();
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (highlight && highlight.year === year && highlight.m === m && cellRefs.current[highlight.d]) {
      cellRefs.current[highlight.d]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight, year, m]);

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-7 border-b border-border pb-2 text-center">
        {DOW_SHORT.map((d, i) => (
          <div
            key={d}
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wider",
              i === 5 ? "text-primary" : "text-muted-foreground",
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`e${i}`} aria-hidden className="aspect-[1/1.1]" />
        ))}
        {data.map((entry, d) => {
          const [hDay, hMonth, , dayCode] = entry;
          const gregDay = d + 1;
          const isToday = today?.year === year && today.m === m && today.d === d;
          const isFri = dayCode === "J";
          const isNew = isNewHijriMonth(takwim, m, d);
          const isHighlight = highlight?.year === year && highlight.m === m && highlight.d === d;

          return (
            <button
              key={d}
              ref={(el) => { cellRefs.current[d] = el; }}
              onClick={() => onSelect({ year, m, d })}
              className={cn(
                "group relative flex aspect-[1/1.1] flex-col items-center justify-center rounded-lg border border-transparent bg-card px-0.5 py-1.5 text-center transition-all hover:border-border hover:shadow-sm",
                isToday && "border-primary/40 ring-1 ring-primary/15",
                isHighlight && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
            >
              <span
                className={cn(
                  "text-base font-semibold leading-none sm:text-lg",
                  isFri ? "text-primary" : "text-foreground",
                )}
              >
                {gregDay}
              </span>
              <span className="mt-1 text-xs leading-none text-muted-foreground">{hDay}</span>
              {isNew && (
                <span className="mt-0.5 hidden text-[9px] font-semibold uppercase tracking-wide text-primary sm:block">
                  {HIJRI_MONTHS[hMonth].slice(0, 5)}
                </span>
              )}
              {isNew && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-primary/60 bg-card" /> Today
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> New Hijri month
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-primary/70" /> Friday
        </span>
      </div>
    </section>
  );
}
