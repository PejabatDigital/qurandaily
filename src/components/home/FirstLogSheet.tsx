import { Check, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { getSurahForPage } from "@/lib/quran-data";
import { pagesLabel } from "@/lib/plan";

export type FirstLog = {
  pagesRead: number;
  /** The page the reader is on now (already capped at the plan's last page). */
  page: number;
  /** Pages still to read today to stay on track (0 when today's target is met). */
  remainingToday: number;
};

interface FirstLogSheetProps {
  log: FirstLog | null;
  onClose: () => void;
}

/** Bottom sheet celebrating the very first log on a reading plan. */
const FirstLogSheet = ({ log, onClose }: FirstLogSheetProps) => (
  <Sheet open={!!log} onOpenChange={(open) => !open && onClose()}>
    <SheetContent
      side="bottom"
      hideClose
      overlayClassName="bg-foreground/35"
      className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-t-3xl border-0 bg-card px-6 pb-10 pt-6 text-center"
    >
      {log && (
        <>
          <div className="h-1 w-10 rounded-sm bg-border" aria-hidden />
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <SheetTitle className="text-[26px] font-bold leading-8 tracking-[-0.5px] text-foreground">
            First reading logged
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {pagesLabel(log.pagesRead)}. You're now on page {log.page}, {getSurahForPage(log.page)}.
          </SheetDescription>
          <div className="flex items-center gap-2 rounded-full bg-primary/10 p-3">
            <Flame className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-sm font-medium text-primary">Day 1 of your streak</span>
          </div>
          {log.remainingToday > 0 && (
            <p className="text-xs text-muted-foreground">
              {log.remainingToday} more {log.remainingToday === 1 ? "page" : "pages"} today keeps you on track.
            </p>
          )}
          <Button size="lg" className="w-full" onClick={onClose}>
            Done
          </Button>
        </>
      )}
    </SheetContent>
  </Sheet>
);

export default FirstLogSheet;
