import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ZonePicker } from "@/components/takwim/ZonePicker";
import { DayDetailSheet } from "@/components/takwim/DayDetailSheet";
import { useSelectedZone, useSolatMonth } from "@/hooks/useSolat";
import { PRAYER_LABELS, formatPrayerTime } from "@/lib/solat";
import { todayInTakwim } from "@/lib/takwim";
import { RAW, HIJRI_MONTHS, MONTHS_EN, DAY_EN } from "@/data/takwim2026";

const YEAR = 2026;

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const TodayCard = () => {
  const today = useMemo(() => todayInTakwim(), []);
  const now = useNow();
  const [zone] = useSelectedZone();
  const [sheetOpen, setSheetOpen] = useState(false);

  const todayDate = new Date();
  const month = todayDate.getMonth() + 1;
  const day = todayDate.getDate();

  const { data, isLoading, isError } = useSolatMonth(zone, YEAR, month);
  const prayer = data?.prayers.find((p) => p.day === day);

  const nextPrayer = useMemo(() => {
    if (!prayer) return null;
    const nowSec = Math.floor(now.getTime() / 1000);
    const ordered = PRAYER_LABELS.filter((p) => p.key !== "syuruk");
    for (const { key, label } of ordered) {
      const t = prayer[key];
      if (t > nowSec) {
        return { key, label, unix: t, msUntil: (t - nowSec) * 1000 };
      }
    }
    return null;
  }, [prayer, now]);

  const gregLine = today
    ? `${DAY_EN[RAW[today.m][today.d][3]]}, ${today.d + 1} ${MONTHS_EN[today.m]} ${YEAR}`
    : todayDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const hijriLine = today
    ? (() => {
        const [hDay, hMonth, hYear] = RAW[today.m][today.d];
        return `${hDay} ${HIJRI_MONTHS[hMonth]} ${hYear} H`;
      })()
    : null;

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">{gregLine}</p>
              {hijriLine && (
                <p className="text-sm text-primary" style={{ fontFamily: "Amiri, serif" }}>
                  {hijriLine}
                </p>
              )}
            </div>
            <ZonePicker />
          </div>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="block w-full rounded-lg border border-border bg-muted/40 p-3 text-left transition-colors hover:bg-muted/60 active:bg-muted"
            aria-label="Show prayer times"
          >
            {isLoading ? (
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : isError || !prayer ? (
              <p className="text-xs text-destructive">Could not load prayer times.</p>
            ) : nextPrayer ? (
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Next prayer
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {nextPrayer.label}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      in {formatCountdown(nextPrayer.msUntil)}
                    </span>
                  </p>
                </div>
                <span className="text-lg font-semibold tabular-nums text-primary">
                  {formatPrayerTime(nextPrayer.unix)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">All prayers completed for today.</p>
            )}
          </button>
        </CardContent>
      </Card>

      <DayDetailSheet
        selected={sheetOpen && today ? { m: today.m, d: today.d } : null}
        onOpenChange={setSheetOpen}
        highlightPrayer={nextPrayer?.key ?? null}
      />
    </>
  );
};

export default TodayCard;
