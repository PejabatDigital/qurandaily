import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { endOfRamadan } from "@/lib/takwim";
import { INITIAL_DRAFT, derivePlan, toDateInput, type PlanDraft } from "./draft";
import WelcomeStep from "./WelcomeStep";
import GoalStep from "./GoalStep";
import FinishStep from "./FinishStep";
import StartStep from "./StartStep";
import PersonalStep from "./PersonalStep";
import ReadyStep from "./ReadyStep";

const STEPS = ["welcome", "goal", "finish", "start", "personal", "ready"] as const;
type StepId = (typeof STEPS)[number];

interface OnboardingFlowProps {
  /** "goal" skips the welcome screen (starting another plan). */
  startAt?: "welcome" | "goal";
  /** Back from the first step when there's nothing before it. */
  onExit?: () => void;
  /** Called once the plan is created and the plan list has refetched. */
  onComplete: () => void;
}

/** Full-screen welcome and set-up flow that creates a reading plan. */
const OnboardingFlow = ({ startAt = "welcome", onExit, onComplete }: OnboardingFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<StepId>(startAt);
  const [draft, setDraft] = useState<PlanDraft>(INITIAL_DRAFT);
  const [nameTouched, setNameTouched] = useState(false);

  // Fixed for the whole flow so dates don't shift if it stays open past midnight.
  const today = useMemo(() => new Date(), []);
  const ramadanEnd = useMemo(() => endOfRamadan(today), [today]);
  const plan = useMemo(() => derivePlan(draft, today, ramadanEnd), [draft, today, ramadanEnd]);

  const { data: savedName } = useQuery({
    queryKey: ["profile_name", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
      return data?.display_name || null;
    },
    enabled: !!user,
  });

  // Returning users: start from the name they already gave us.
  useEffect(() => {
    if (savedName && !nameTouched) setDraft((d) => ({ ...d, name: savedName }));
  }, [savedName, nameTouched]);

  const update = (patch: Partial<PlanDraft>) => {
    if ("name" in patch) setNameTouched(true);
    setDraft((d) => ({ ...d, ...patch }));
  };

  const index = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(index + 1, STEPS.length - 1)]);
  const back = () => {
    if (step === startAt) onExit?.();
    else setStep(STEPS[Math.max(index - 1, 0)]);
  };

  const createPlan = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Your session isn't ready yet. Please try again.");
      if (!plan.finishDate) throw new Error("Pick a finish date first.");

      const name = draft.name.trim();
      if (!draft.personalSkipped && name && name !== savedName) {
        const { error } = await supabase.from("profiles").update({ display_name: name }).eq("user_id", user.id);
        if (error) throw error;
      }

      const { error: deactivateError } = await supabase
        .from("campaigns")
        .update({ is_active: false })
        .eq("user_id", user.id);
      if (deactivateError) throw deactivateError;

      const { error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        title: plan.title,
        start_page: plan.startPage,
        end_page: plan.goalEnd,
        end_date: toDateInput(plan.finishDate),
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["profile_name"] }),
      ]);
      onComplete();
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't create your reading plan", description: error.message, variant: "destructive" });
    },
  });

  const stepProps = { draft, plan, update, onBack: back, onNext: next };

  // key={step} remounts each screen so it scrolls to the top and focuses its heading.
  switch (step) {
    case "welcome":
      return <WelcomeStep key={step} onNext={next} />;
    case "goal":
      return <GoalStep key={step} {...stepProps} />;
    case "finish":
      return <FinishStep key={step} {...stepProps} today={today} ramadanEnd={ramadanEnd} />;
    case "start":
      return <StartStep key={step} {...stepProps} />;
    case "personal":
      return <PersonalStep key={step} {...stepProps} />;
    case "ready":
      return <ReadyStep key={step} plan={plan} onStart={() => createPlan.mutate()} starting={createPlan.isPending} />;
  }
};

export default OnboardingFlow;
