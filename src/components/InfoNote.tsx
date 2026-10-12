import type { ReactNode } from "react";
import { Info } from "lucide-react";

/** Small reassurance or tip. */
const InfoNote = ({ children }: { children: ReactNode }) => (
  <div className="flex w-full items-start gap-3 rounded-lg bg-primary/10 p-3">
    <Info className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
    <p className="flex-1 text-xs text-foreground">{children}</p>
  </div>
);

export default InfoNote;
