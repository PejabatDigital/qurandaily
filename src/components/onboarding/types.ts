import type { DerivedPlan, PlanDraft } from "./draft";

export interface StepProps {
  draft: PlanDraft;
  plan: DerivedPlan;
  update: (patch: Partial<PlanDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}
