import { useState } from "react";
import { Button } from "@/components/ui/button";
import OptionCard from "@/components/OptionCard";
import InputField from "@/components/InputField";
import { getSurahForPage } from "@/lib/quran-data";
import { pagesLabel } from "@/lib/plan";
import OnboardingScreen from "./OnboardingScreen";
import type { StepProps } from "./types";

const StartStep = ({ draft, plan, update, onBack, onNext }: StepProps) => {
  const [attempted, setAttempted] = useState(false);
  const current = draft.startFrom === "current";
  const showPageError = attempted || !!draft.currentPage;

  const next = () => {
    setAttempted(true);
    if (!plan.pageError) onNext();
  };

  const helper =
    current && !plan.pageError && plan.perDay !== null
      ? `Page ${plan.startPage} is in ${getSurahForPage(plan.startPage)}. ${pagesLabel(plan.pagesRemaining)} to go: ${plan.perDay} a day.`
      : undefined;

  return (
    <OnboardingScreen
      step={3}
      onBack={onBack}
      title="Where are you starting?"
      subtitle="Already part-way through? Start from your page."
      actions={
        <Button size="lg" className="w-full" onClick={next}>
          Continue
        </Button>
      }
    >
      <div role="radiogroup" aria-label="Starting point" className="flex w-full flex-col gap-3">
        <OptionCard
          title="From the beginning"
          description={`Page ${plan.goalStart}, ${getSurahForPage(plan.goalStart)}`}
          selected={!current}
          onSelect={() => update({ startFrom: "beginning" })}
        />
        <OptionCard
          title="I'm already reading"
          description="Start from the page you're on"
          selected={current}
          onSelect={() => update({ startFrom: "current" })}
        />
      </div>

      {current && (
        <div className="w-full">
          <InputField
            label="What page are you on?"
            type="number"
            inputMode="numeric"
            min={plan.goalStart}
            max={plan.goalEnd}
            value={draft.currentPage}
            onChange={(e) => update({ currentPage: e.target.value })}
            helper={helper}
            error={showPageError ? plan.pageError : null}
            autoFocus
          />
        </div>
      )}
    </OnboardingScreen>
  );
};

export default StartStep;
