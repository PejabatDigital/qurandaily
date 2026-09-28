import { useSolatMonth } from "@/hooks/useSolat";
import { useSelectedZone } from "@/hooks/useSolat";
import { PRAYER_LABELS, formatPrayerTime, type DayPrayer } from "@/lib/solat";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const YEAR = 2026;

interface PrayerTimesProps {
  /** 0-indexed month */
  m: number;
  /** 0-indexed day */
  d: number;
  highlightKey?: keyof Omit<DayPrayer, "day" | "hijri"> | null;
}

export function PrayerTimes({ m, d, highlightKey }: PrayerTimesProps) {
  const [zone] = useSelectedZone();
  const month = m + 1;
  const day = d + 1;
  const { data, isLoading, isError } = useSolatMonth(zone, YEAR, month);

  const prayer = data?.prayers.find((p) => p.day === day);

  if (isLoading) {
    return (
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        {PRAYER_LABELS.map(({ key }) => (
          <li key={key} className="flex items-center justify-between">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-10" />
          </li>
        ))}
      </ul>
    );
  }

  if (isError || !prayer) {
    return (
      <p className="text-xs text-destructive">Could not load prayer times. Please try again.</p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
      {PRAYER_LABELS.map(({ key, label }) => (
        <li
          key={key}
          className={cn(
            "flex items-baseline justify-between border-b border-border/60 pb-1.5 transition-colors",
            highlightKey === key && "border-primary",
          )}
        >
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider",
              highlightKey === key ? "text-primary" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "text-base font-semibold tabular-nums",
              highlightKey === key ? "text-primary" : "text-foreground",
            )}
          >
            {formatPrayerTime(prayer[key])}
          </span>
        </li>
      ))}
    </ul>
  );
}
