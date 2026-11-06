import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  title: ReactNode;
  description?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

/** One choice in a list. The whole card is tappable; selected has a blue edge and tint. */
const OptionCard = ({ title, description, selected, onSelect }: OptionCardProps) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={cn(
      "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      selected ? "border-primary bg-accent-soft" : "border-transparent bg-card hover:bg-subtle",
    )}
  >
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[17px] font-semibold leading-6 text-foreground">{title}</span>
      {description && <span className="text-[13px] leading-[18px] text-muted-foreground">{description}</span>}
    </span>
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
      {selected ? (
        <circle cx="10" cy="10" r="7" className="fill-card stroke-primary" strokeWidth="6" />
      ) : (
        <circle cx="10" cy="10" r="9.25" className="stroke-faint" strokeWidth="1.5" />
      )}
    </svg>
  </button>
);

export default OptionCard;
