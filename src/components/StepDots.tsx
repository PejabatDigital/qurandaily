import { cn } from "@/lib/utils";

interface StepDotsProps {
  /** 1-based current step. */
  current: number;
  total: number;
}

/** Progress through set-up steps. The current step is the long pill. */
const StepDots = ({ current, total }: StepDotsProps) => (
  <div className="flex gap-1.5" role="img" aria-label={`Step ${current} of ${total}`}>
    {Array.from({ length: total }, (_, i) => (
      <span
        key={i}
        className={cn(
          "h-1.5 rounded-[3px] transition-all",
          i + 1 === current ? "w-6" : "w-1.5",
          i + 1 <= current ? "bg-primary" : "bg-muted",
        )}
      />
    ))}
  </div>
);

export default StepDots;
