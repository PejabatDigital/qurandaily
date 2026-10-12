import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import InputField from "@/components/InputField";
import { ZonePicker } from "@/components/takwim/ZonePicker";
import OnboardingScreen from "./OnboardingScreen";
import type { StepProps } from "./types";

const PersonalStep = ({ draft, update, onBack, onNext }: StepProps) => {
  const zoneId = useId();
  const zoneHelpId = useId();

  return (
    <OnboardingScreen
      step={4}
      onBack={onBack}
      title="A few personal touches"
      subtitle="Both optional. You can skip this step."
      actions={
        <>
          <Button size="lg" className="w-full" onClick={() => { update({ personalSkipped: false }); onNext(); }}>
            Continue
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => { update({ personalSkipped: true }); onNext(); }}>
            Skip for now
          </Button>
        </>
      }
    >
      <div className="w-full">
        <InputField
          label="What should we call you?"
          placeholder="e.g. Ahmad"
          autoComplete="given-name"
          maxLength={50}
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      <div className="w-full space-y-2">
        <Label htmlFor={zoneId}>Prayer times zone</Label>
        <ZonePicker variant="field" id={zoneId} aria-describedby={zoneHelpId} />
        <p id={zoneHelpId} className="text-xs text-muted-foreground">
          Shows the next prayer on your home screen.
        </p>
      </div>
    </OnboardingScreen>
  );
};

export default PersonalStep;
