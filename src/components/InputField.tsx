import { forwardRef, useId, type ComponentProps, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InputFieldProps extends ComponentProps<typeof Input> {
  label: ReactNode;
  /** Muted text under the input. Replaced by `error` while there is one. */
  helper?: ReactNode;
  /** Marks the input invalid (2px destructive border) and shows this message in red. */
  error?: ReactNode;
}

/** Label + input + helper text, with an error state. */
const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, helper, error, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = `${inputId}-message`;
    const message = error || helper;

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId}>{label}</Label>
        <Input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...props}
        />
        {message && (
          <p
            id={messageId}
            role={error ? "alert" : undefined}
            aria-live={error ? undefined : "polite"}
            className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}
          >
            {message}
          </p>
        )}
      </div>
    );
  },
);
InputField.displayName = "InputField";

export default InputField;
