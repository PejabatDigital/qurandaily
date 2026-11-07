import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectedZone, useSolatMonth } from "@/hooks/useSolat";
import { useNow } from "@/hooks/useNow";
import { PRAYER_LABELS, SolatUnavailableError, formatPrayerTime, nextPrayer, weekAhead } from "@/lib/solat";
import { cn } from "@/lib/utils";

/** This week's prayer times as a timetable (like the printed weekly jadual at the
 *  masjid): today and the next six days, six times each. Today's row is tinted and the
 *  next prayer is bold blue. A week that runs into the next month fetches both months. */
const WeekPrayerTimes = () => {
  const [zone] = useSelectedZone();
  const now = useNow();
  const days = weekAhead(now);
  const first = days[0];
  const last = days[days.length - 1];
  const twoMonths = last.month !== first.month;

  const thisMonth = useSolatMonth(zone, first.year, first.month);
  const nextMonth = useSolatMonth(zone, last.year, last.month, { enabled: twoMonths });

  const prayerOn = (d: (typeof days)[number]) =>
    (d.month === first.month ? thisMonth.data : nextMonth.data)?.prayers.find((p) => p.day === d.day);

  const today = prayerOn(first);
  const next = today ? nextPrayer(today, Math.floor(now.getTime() / 1000)) : null;

  let body;
  if (thisMonth.isLoading) {
    body = (
      <div className="space-y-2.5 pt-1">
        {days.map((d) => <Skeleton key={d.day} className="h-6 w-full" />)}
      </div>
    );
  } else if (thisMonth.error instanceof SolatUnavailableError) {
    body = <p className="text-small text-muted-foreground">Prayer times for {first.year} aren't available yet.</p>;
  } else if (thisMonth.isError) {
    body = <p className="text-small text-destructive">Couldn't load prayer times. Try again later.</p>;
  } else {
    body = (
      <table className="w-full table-fixed border-separate border-spacing-0 text-center">
        <caption className="sr-only">Prayer times for today and the next six days, zone {zone}</caption>
        <colgroup>
          <col className="w-11" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="sr-only">Day</th>
            {PRAYER_LABELS.map(({ key, label }) => (
              <th key={key} scope="col" className="pb-1.5 text-caption font-medium text-muted-foreground">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((d, i) => {
            const prayer = prayerOn(d);
            const isToday = i === 0;
            return (
              <tr key={`${d.month}-${d.day}`} className={cn(isToday && "bg-accent-soft")}>
                <th
                  scope="row"
                  className={cn("py-1.5 pl-2 text-left font-medium", isToday && "rounded-l-xl")}
                >
                  <span className={cn("block text-small", isToday ? "text-primary" : "text-foreground")}>
                    {isToday ? "Today" : format(d.date, "EEE")}
                  </span>
                  {/* The month only on the 1st, when the week runs into a new month. */}
                  <span className="block text-caption font-normal text-muted-foreground">
                    {format(d.date, d.day === 1 ? "d MMM" : "d")}
                  </span>
                </th>
                {PRAYER_LABELS.map(({ key }, j) => (
                  <td
                    key={key}
                    className={cn(
                      "py-1.5 text-small tabular-nums",
                      isToday ? "text-primary" : "text-foreground",
                      key === "syuruk" && "text-muted-foreground",
                      isToday && next?.key === key && "font-semibold",
                      isToday && j === PRAYER_LABELS.length - 1 && "rounded-r-xl",
                    )}
                  >
                    {prayer ? formatPrayerTime(prayer[key]) : "–"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <section aria-labelledby="week-prayers" className="rounded-2xl bg-card px-3 pb-3 pt-4">
      <h2 id="week-prayers" className="px-1 pb-3 text-heading font-semibold text-foreground">
        Prayer times this week
      </h2>
      {body}
    </section>
  );
};

export default WeekPrayerTimes;
