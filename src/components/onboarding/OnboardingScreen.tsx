import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import StepDots from "@/components/StepDots";
import { cn } from "@/lib/utils";

export const SETUP_STEPS = 4;

interface OnboardingScreenProps {
  /** 1-based set-up step. Shows the top bar with a back button and step dots. */
  step?: number;
  onBack?: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Centre the content (plan ready). */
  centered?: boolean;
  /** Top padding when there's no top bar. */
  topPadding?: string;
  actions: ReactNode;
  children?: ReactNode;
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <h1 tabIndex={-1} className="text-[26px] font-bold leading-8 tracking-[-0.5px] text-foreground outline-none">
      {children}
    </h1>
  );
}

/** Full-screen onboarding layout: optional top bar, scrolling content, actions pinned to the bottom. */
const OnboardingScreen = ({
  step, onBack, title, subtitle, centered, topPadding = "pt-14", actions, children,
}: OnboardingScreenProps) => {
  const mainRef = useRef<HTMLElement>(null);

  // Each step mounts its own screen: start at the top and move focus to the
  // heading so screen readers announce the new step.
  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.querySelector("h1")?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col">
        {step !== undefined && (
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <StepDots current={step} total={SETUP_STEPS} />
            <div className="h-10 w-10" aria-hidden />
          </div>
        )}

        <main
          ref={mainRef}
          className={cn(
            "flex flex-1 flex-col gap-6 px-4",
            step !== undefined ? "pt-2" : topPadding,
            centered && "items-center",
          )}
        >
          {title && (
            <div className={cn("w-full space-y-2", centered && "text-center")}>
              <ScreenTitle>{title}</ScreenTitle>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>

        <div className="sticky bottom-0 flex flex-col items-center gap-2 bg-background px-4 pb-8 pt-4">
          {actions}
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
