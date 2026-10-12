import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipProps {
  children: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

/** Quick-pick option, e.g. finish date presets. Chips wrap onto multiple rows. */
const Chip = ({ children, selected, onSelect }: ChipProps) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={cn(
      "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full border px-4 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-foreground hover:border-primary/40",
    )}
  >
    {children}
  </button>
);

export default Chip;
