import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Clear day Text Field: 48px, soft fill, blue edge on focus, red edge on error.
          "flex h-12 w-full rounded-xl border-2 border-transparent bg-subtle px-3.5 text-[17px] leading-6 text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-faint focus-visible:border-primary focus-visible:bg-card focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
