import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PrayerTimes } from "@/components/takwim/PrayerTimes";
import { ZonePicker } from "@/components/takwim/ZonePicker";
import { HIJRI_MONTHS, MONTHS_EN, DAY_EN } from "@/data/takwim";
import { getTakwimYear, isNewHijriMonth, type TakwimDay } from "@/lib/takwim";
import type { DayPrayer } from "@/lib/solat";

interface DayDetailSheetProps {
  selected: TakwimDay | null;
  onOpenChange: (open: boolean) => void;
  highlightPrayer?: keyof Omit<DayPrayer, "day" | "hijri"> | null;
}

export function DayDetailSheet({ selected, onOpenChange, highlightPrayer }: DayDetailSheetProps) {
  const takwim = selected ? getTakwimYear(selected.year) : null;
  const open = !!selected && !!takwim;

  const detail = selected && takwim
    ? {
        gregDay: selected.d + 1,
        gregMonth: MONTHS_EN[selected.m],
        hDay: takwim.days[selected.m][selected.d][0],
        hMonth: takwim.days[selected.m][selected.d][1],
        hYear: takwim.days[selected.m][selected.d][2],
        dayCode: takwim.days[selected.m][selected.d][3],
        isNew: isNewHijriMonth(takwim, selected.m, selected.d),
      }
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
        {detail && (
          <div className="space-y-5 px-5 pb-[max(32px,env(safe-area-inset-bottom))] pt-4">
            <SheetHeader className="space-y-1 text-left">
              <p className="text-small font-medium text-muted-foreground">
                {DAY_EN[detail.dayCode]} · {detail.gregMonth} {selected.year}
              </p>
              <div className="flex items-baseline gap-3">
                <SheetTitle className="text-[48px] font-semibold leading-[52px] tracking-[-0.02em]">
                  {detail.gregDay}
                </SheetTitle>
                <span className="text-heading text-primary">
                  {detail.hDay} {HIJRI_MONTHS[detail.hMonth]} {detail.hYear} H
                </span>
              </div>
            </SheetHeader>

            {(detail.dayCode === "J" || detail.isNew) && (
              <div className="flex flex-wrap items-center gap-2">
                {detail.dayCode === "J" && (
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-caption font-medium text-primary">
                    Friday
                  </span>
                )}
                {detail.isNew && (
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-caption font-medium text-primary">
                    ☾ New {HIJRI_MONTHS[detail.hMonth]}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-3 rounded-2xl bg-subtle p-4">
              <div className="flex items-center justify-between">
                <p className="text-heading font-semibold text-foreground">
                  Prayer times
                </p>
                <ZonePicker />
              </div>
              <PrayerTimes year={selected.year} m={selected.m} d={selected.d} highlightKey={highlightPrayer ?? null} />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
