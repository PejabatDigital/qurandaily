import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import OptionCard from "@/components/OptionCard";
import SurahSelect from "@/components/SurahSelect";
import { GOAL_LABELS } from "@/lib/plan";
import OnboardingScreen from "./OnboardingScreen";
import type { StepProps } from "./types";

const GoalStep = ({ draft, plan, update, onBack, onNext }: StepProps) => (
  <OnboardingScreen
    step={1}
    onBack={onBack}
    title="What would you like to read?"
    subtitle="Pick a goal. You can change it later."
    actions={
      <Button size="lg" className="w-full" onClick={onNext} disabled={!!plan.rangeError}>
        Continue
      </Button>
    }
  >
    <div role="radiogroup" aria-label="Goal" className="flex w-full flex-col gap-3">
      <OptionCard
        title={GOAL_LABELS.full}
        description="All 604 pages, Al-Fatihah to An-Nas"
        selected={draft.goal === "full"}
        onSelect={() => update({ goal: "full" })}
      />
      <OptionCard
        title={GOAL_LABELS.juzAmma}
        description="The short surahs, An-Naba to An-Nas"
        selected={draft.goal === "juzAmma"}
        onSelect={() => update({ goal: "juzAmma" })}
      />
      <OptionCard
        title={GOAL_LABELS.range}
        description="Pick a start and end surah"
        selected={draft.goal === "range"}
        onSelect={() => update({ goal: "range" })}
      />
    </div>

    {draft.goal === "range" && (
      <div className="w-full space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="goal-start-surah">Start surah</Label>
            <SurahSelect id="goal-start-surah" value={draft.startSurah} onValueChange={(v) => update({ startSurah: v })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-end-surah">End surah</Label>
            <SurahSelect
              id="goal-end-surah"
              value={draft.endSurah}
              onValueChange={(v) => update({ endSurah: v })}
              invalid={!!plan.rangeError}
            />
          </div>
        </div>
        {plan.rangeError && (
          <p role="alert" className="text-xs text-destructive">{plan.rangeError}</p>
        )}
      </div>
    )}
  </OnboardingScreen>
);

export default GoalStep;
