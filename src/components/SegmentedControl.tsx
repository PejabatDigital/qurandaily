import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Clear day's Segmented Control: a soft track with the chosen option raised on it. */
function SegmentedControl<T extends string>({ label, options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn("flex gap-0.5 rounded-full bg-subtle p-[3px]", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 flex-1 rounded-2xl px-4 text-[13px] font-medium leading-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === o.value
              ? "bg-card text-foreground shadow-[0_1px_2px_rgba(19,32,74,.06),0_2px_8px_rgba(19,32,74,.06)]"
              : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default SegmentedControl;
