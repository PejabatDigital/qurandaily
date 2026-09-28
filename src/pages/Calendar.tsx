import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarGrid } from "@/components/takwim/CalendarGrid";
import { ZonePicker } from "@/components/takwim/ZonePicker";
import { DayDetailSheet } from "@/components/takwim/DayDetailSheet";
import { MONTHS_EN } from "@/data/takwim2026";
import { todayInTakwim, hijriRangeLabel } from "@/lib/takwim";

type Selected = { m: number; d: number } | null;

const CalendarPage = () => {
  const navigate = useNavigate();
  const today = todayInTakwim();
  const [m, setM] = useState<number>(today?.m ?? new Date().getMonth());
  const [selected, setSelected] = useState<Selected>(null);

  const prev = () => setM((cur) => (cur + 11) % 12);
  const next = () => setM((cur) => (cur + 1) % 12);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold tracking-tight">Calendar</h1>
          </div>
          <ZonePicker />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 pb-12 pt-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prev} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">{MONTHS_EN[m]} 2026</p>
            <p className="text-xs text-primary" style={{ fontFamily: "Amiri, serif" }}>
              {hijriRangeLabel(m)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={next} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <CalendarGrid m={m} highlight={selected} onSelect={(mm, dd) => setSelected({ m: mm, d: dd })} />
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
