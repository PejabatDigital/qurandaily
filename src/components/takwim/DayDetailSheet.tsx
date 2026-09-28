import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PrayerTimes } from "@/components/takwim/PrayerTimes";
import { ZonePicker } from "@/components/takwim/ZonePicker";
import { RAW, HIJRI_MONTHS, MONTHS_EN, DAY_EN } from "@/data/takwim2026";
import { isNewHijriMonth } from "@/lib/takwim";
import { cn } from "@/lib/utils";
import type { DayPrayer } from "@/lib/solat";

type Selected = { m: number; d: number } | null;

interface DayDetailSheetProps {
  selected: Selected;
  onOpenChange: (open: boolean) => void;
  highlightPrayer?: keyof Omit<DayPrayer, "day" | "hijri"> | null;
}

export function DayDetailSheet({ selected, onOpenChange, highlightPrayer }: DayDetailSheetProps) {
  const open = !!selected;

  const detail = selected
    ? {
        gregDay: selected.d + 1,
        gregMonth: MONTHS_EN[selected.m],
        hDay: RAW[selected.m][selected.d][0],
        hMonth: RAW[selected.m][selected.d][1],
        hYear: RAW[selected.m][selected.d][2],
        dayCode: RAW[selected.m][selected.d][3],
        isNew: isNewHijriMonth(selected.m, selected.d),
      }
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-2xl border-border p-0"
      >
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border" />
        {detail && (
          <div className="space-y-4 px-5 pt-4 pb-[max(5rem,env(safe-area-inset-bottom))]">
            <SheetHeader className="space-y-1 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {DAY_EN[detail.dayCode]} · {detail.gregMonth} 2026
              </p>
              <div className="flex items-baseline gap-3">
                <SheetTitle className="text-5xl font-bold leading-none tracking-tight">
                  {detail.gregDay}
                </SheetTitle>
                <span className="text-base text-primary" style={{ fontFamily: "Amiri, serif" }}>
                  {detail.hDay} {HIJRI_MONTHS[detail.hMonth]} {detail.hYear} H
                </span>
              </div>
            </SheetHeader>

            {(detail.dayCode === "J" || detail.isNew) && (
              <div className="flex flex-wrap items-center gap-2">
                {detail.dayCode === "J" && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Friday
                  </span>
                )}
                {detail.isNew && (
                  <span className="rounded-full border border-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    ☾ New {HIJRI_MONTHS[detail.hMonth]}
                  </span>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Prayer times
                </p>
                <ZonePicker />
              </div>
              <PrayerTimes m={selected.m} d={selected.d} highlightKey={highlightPrayer ?? null} />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
