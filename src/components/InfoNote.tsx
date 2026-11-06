import type { ReactNode } from "react";
import { Info } from "lucide-react";

/** Small reassurance or tip. */
const InfoNote = ({ children }: { children: ReactNode }) => (
  <div className="flex w-full items-start gap-3 rounded-xl bg-accent-soft p-3">
    <Info className="mt-px h-4 w-4 shrink-0 text-primary" aria-hidden />
    <p className="flex-1 text-[13px] leading-[18px] text-foreground">{children}</p>
  </div>
);

export default InfoNote;
