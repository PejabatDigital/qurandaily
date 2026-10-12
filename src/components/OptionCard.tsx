import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  title: ReactNode;
  description?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

/** One choice in a list. The whole card is tappable; selected has a green border and tint. */
const OptionCard = ({ title, description, selected, onSelect }: OptionCardProps) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={cn(
      "flex w-full items-center gap-3 rounded-lg text-left ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      selected
        ? "border-2 border-primary bg-primary/10 p-[15px]"
        : "border border-border bg-card p-4 hover:border-primary/40",
    )}
  >
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-base font-semibold text-foreground">{title}</span>
      {description && <span className="text-xs text-muted-foreground">{description}</span>}
    </span>
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
      {selected ? (
        <circle cx="10" cy="10" r="7" className="fill-background stroke-primary" strokeWidth="6" />
      ) : (
        <circle cx="10" cy="10" r="9.25" className="stroke-border" strokeWidth="1.5" />
      )}
    </svg>
  </button>
);

export default OptionCard;
