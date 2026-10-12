import { format } from "date-fns";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import InfoNote from "@/components/InfoNote";
import { getSurahForPage } from "@/lib/quran-data";
import { pagesLabel } from "@/lib/plan";
import OnboardingScreen, { ScreenTitle } from "./OnboardingScreen";
import type { DerivedPlan } from "./draft";

interface ReadyStepProps {
  plan: DerivedPlan;
  onStart: () => void;
  starting: boolean;
}

const ReadyStep = ({ plan, onStart, starting }: ReadyStepProps) => {
  const rows: [string, string][] = [
    ["Goal", plan.title],
    ["Finish by", plan.finishDate ? format(plan.finishDate, "EEE, d MMM yyyy") : ""],
    ["Each day", plan.perDay !== null ? pagesLabel(plan.perDay) : ""],
    ["Starting at", `Page ${plan.startPage}, ${getSurahForPage(plan.startPage)}`],
  ];

  return (
    <OnboardingScreen
      centered
      topPadding="pt-[72px]"
      actions={
        <Button size="lg" className="w-full" onClick={onStart} disabled={starting}>
          {starting ? "Setting up..." : "Start reading"}
        </Button>
      }
    >
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary/10">
        <Check className="h-8 w-8 text-primary" aria-hidden />
      </div>

      <div className="w-full space-y-2 text-center">
        <ScreenTitle>Your reading plan is ready</ScreenTitle>
        <p className="text-sm text-muted-foreground">Bismillah. Here's what we've set up.</p>
      </div>

      <Card className="w-full p-4">
        <dl className="space-y-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <InfoNote>Your progress is saved on this device and browser.</InfoNote>
    </OnboardingScreen>
  );
};

export default ReadyStep;
