import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export type Completion = {
  /** The whole Quran (khatam) rather than part of it. */
  khatam: boolean;
  pages: number;
  days: number;
  bestStreak: number;
};

interface KhatamCelebrationProps {
  completion: Completion;
  onStartNext: () => void;
  onHome: () => void;
}

/** Full-screen celebration when a reading plan reaches 100%. */
const KhatamCelebration = ({ completion, onStartNext, onHome }: KhatamCelebrationProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { khatam, pages, days, bestStreak } = completion;
  const stats: [number, string][] = [
    [days, days === 1 ? "day" : "days"],
    [Math.round(pages / days), "pages a day"],
    [bestStreak, "best streak"],
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col">
        <main className="flex flex-1 flex-col items-center gap-6 px-4 pt-14">
          <div className="flex w-full flex-col items-center gap-3 rounded-2xl bg-primary px-6 py-8 text-center text-primary-foreground">
            <p lang="ar" dir="rtl" className="w-full text-[28px] leading-[48px]" style={{ fontFamily: "Amiri, serif" }}>
              ٱلْحَمْدُ لِلَّهِ
            </p>
            <h1 ref={headingRef} tabIndex={-1} className="w-full text-[26px] font-bold leading-8 tracking-[-0.5px] outline-none">
              {khatam ? "Khatam complete" : "Reading plan complete"}
            </h1>
          </div>

          <p className="w-full text-center text-sm text-muted-foreground">
            You read all {pages} pages in {days} {days === 1 ? "day" : "days"}. MashaAllah, may it be accepted from you.
          </p>

          <dl className="flex w-full gap-3">
            {stats.map(([value, label]) => (
              <div key={label} className="flex flex-1 flex-col-reverse items-center rounded-lg border border-border bg-card p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-xl font-bold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </main>

        <div className="sticky bottom-0 flex flex-col gap-2 bg-background px-4 pb-8 pt-4">
          <Button size="lg" className="w-full" onClick={onStartNext}>
            {khatam ? "Start your next khatam" : "Start a new plan"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onHome}>
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KhatamCelebration;
