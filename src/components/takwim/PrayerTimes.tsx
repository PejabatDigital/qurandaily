import { useSolatMonth } from "@/hooks/useSolat";
import { useSelectedZone } from "@/hooks/useSolat";
import { PRAYER_LABELS, SolatUnavailableError, formatPrayerTime, type DayPrayer } from "@/lib/solat";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PrayerTimesProps {
  year: number;
  /** 0-indexed month */
  m: number;
  /** 0-indexed day */
  d: number;
  highlightKey?: keyof Omit<DayPrayer, "day" | "hijri"> | null;
}

export function PrayerTimes({ year, m, d, highlightKey }: PrayerTimesProps) {
  const [zone] = useSelectedZone();
  const month = m + 1;
  const day = d + 1;
  const { data, isLoading, isError, error } = useSolatMonth(zone, year, month);

  const prayer = data?.prayers.find((p) => p.day === day);

  if (isLoading) {
    return (
      <ul className="grid grid-cols-2 gap-2">
        {PRAYER_LABELS.map(({ key }) => (
          <li key={key} className="flex items-center justify-between">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-10" />
          </li>
        ))}
      </ul>
    );
  }

  if (error instanceof SolatUnavailableError) {
    return (
      <p className="text-small text-muted-foreground">Prayer times for {year} aren't available yet.</p>
    );
  }

  if (isError || !prayer) {
    return (
      <p className="text-small text-destructive">Couldn't load prayer times. Try again later.</p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2">
      {PRAYER_LABELS.map(({ key, label }) => (
        <li
          key={key}
          className={cn(
            "flex items-baseline justify-between rounded-xl bg-card px-3 py-2.5 transition-colors",
            highlightKey === key && "bg-accent-soft",
          )}
        >
          <span
            className={cn(
              "text-small font-medium",
              highlightKey === key ? "text-primary" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "text-heading font-semibold tabular-nums",
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
