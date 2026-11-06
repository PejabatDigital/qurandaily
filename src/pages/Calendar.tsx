import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarGrid } from "@/components/takwim/CalendarGrid";
import { ZonePicker } from "@/components/takwim/ZonePicker";
import { DayDetailSheet } from "@/components/takwim/DayDetailSheet";
import { MONTHS_EN } from "@/data/takwim";
import {
  TAKWIM_YEARS, getTakwimYear, hijriRangeLabel, stepMonth,
  type MonthCursor, type TakwimDay,
} from "@/lib/takwim";

const CalendarPage = () => {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState<MonthCursor>(() => {
    const now = new Date();
    return { year: now.getFullYear(), m: now.getMonth() };
  });
  const [selected, setSelected] = useState<TakwimDay | null>(null);

  // Years the month arrows can reach: every year with data, plus the current
  // year so it can show the "not yet available" message.
  const navYears = useMemo(
    () => [...new Set([...TAKWIM_YEARS, new Date().getFullYear()])].sort((a, b) => a - b),
    [],
  );
  const { year, m } = cursor;
  const takwim = getTakwimYear(year);
  const prevMonth = stepMonth(cursor, -1, navYears);
  const nextMonth = stepMonth(cursor, 1, navYears);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Calendar" onBack={() => navigate(-1)} right={<ZonePicker />} />

      <main className="mx-auto max-w-lg space-y-4 px-5 pb-12 pt-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="bg-card"
            onClick={() => prevMonth && setCursor(prevMonth)}
            disabled={!prevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="text-heading font-semibold text-foreground">{MONTHS_EN[m]} {year}</p>
            <p className="text-small text-primary">
              {takwim ? hijriRangeLabel(takwim, m) : "\u00a0"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="bg-card"
            onClick={() => nextMonth && setCursor(nextMonth)}
            disabled={!nextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Card>
          <CardContent className="p-3 sm:p-5">
            {takwim ? (
              <CalendarGrid takwim={takwim} m={m} highlight={selected} onSelect={setSelected} />
            ) : (
              <div className="space-y-1 py-10 text-center">
                <p className="text-body font-medium text-foreground">Calendar not yet available for {year}</p>
                <p className="text-small text-muted-foreground">
                  The Hijri calendar for this year hasn't been added yet. Check back later.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <DayDetailSheet
        selected={selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
};

export default CalendarPage;
