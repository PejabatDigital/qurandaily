import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// QD's own text sizes (tailwind.config.ts) must be known to tailwind-merge: otherwise it
// takes `text-caption` for a colour and drops it when a colour like `text-primary` is
// also given.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["date", "title", "heading", "body", "label", "small", "caption"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
