import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Chip from "@/components/Chip";
import InputField from "@/components/InputField";
import { pagesLabel, pagesPerPrayer } from "@/lib/plan";
import OnboardingScreen from "./OnboardingScreen";
import { paceUntil, toDateInput, type FinishPreset } from "./draft";
import type { StepProps } from "./types";

interface FinishStepProps extends StepProps {
  today: Date;
  /** Last day of the next Ramadan from the takwim data, if known. */
  ramadanEnd: Date | null;
}

const FinishStep = ({ draft, plan, update, onBack, onNext, today, ramadanEnd }: FinishStepProps) => {
  const [attempted, setAttempted] = useState(false);

  const presets: [FinishPreset, string][] = [
    ["30", "30 days"],
    ["60", "60 days"],
    ...(ramadanEnd ? [["ramadan", "End of Ramadan"] as [FinishPreset, string]] : []),
    ["year", "1 year"],
    ["date", "Pick a date"],
  ];

  const showDateError = attempted || !!draft.pickedDate;
  const ramadanPace = ramadanEnd ? paceUntil(plan.startPage, plan.goalEnd, today, ramadanEnd) : null;

  const next = () => {
    setAttempted(true);
    if (plan.finishDate) onNext();
  };

  return (
    <OnboardingScreen
      step={2}
      onBack={onBack}
      title="When would you like to finish?"
      subtitle="We'll work out how much to read each day."
      actions={
        <Button size="lg" className="w-full" onClick={next}>
          Continue
        </Button>
      }
    >
      <div role="radiogroup" aria-label="Finish date" className="flex w-full flex-wrap gap-2">
        {presets.map(([value, label]) => (
          <Chip key={value} selected={draft.finish === value} onSelect={() => update({ finish: value })}>
            {label}
          </Chip>
        ))}
      </div>

      {draft.finish === "date" && (
        <div className="w-full">
          <InputField
            label="Finish date"
            type="date"
            min={toDateInput(today)}
            value={draft.pickedDate}
            error={showDateError ? plan.dateError : null}
            onChange={(e) => update({ pickedDate: e.target.value })}
            autoFocus
          />
        </div>
      )}

      {plan.finishDate && plan.perDay !== null && (
        <Card className="w-full space-y-1 p-4" aria-live="polite">
          <p className="text-xs text-muted-foreground">Finishes {format(plan.finishDate, "EEEE, d MMMM yyyy")}</p>
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{plan.perDay}</span>
            <span className="text-base font-semibold text-foreground">
              {plan.perDay === 1 ? "page a day" : "pages a day"}
            </span>
          </p>
          <p className="text-sm text-foreground">About {pagesLabel(pagesPerPrayer(plan.perDay))} after each prayer.</p>
        </Card>
      )}

      {ramadanEnd && ramadanPace !== null && (
        <p className="w-full text-xs text-muted-foreground">
          "End of Ramadan" uses JAKIM's date ({format(ramadanEnd, "d MMMM yyyy")}): about {pagesLabel(ramadanPace)} a day.
        </p>
      )}
    </OnboardingScreen>
  );
};

export default FinishStep;
