import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: ReactNode;
  onBack: () => void;
  /** Something on the right of the Back row, e.g. the prayer zone. */
  right?: ReactNode;
}

/** Clear day page top (as MyDay's Settings): a blue "Back" at the top left, then the
 *  page's large title. */
const PageHeader = ({ title, onBack, right }: PageHeaderProps) => (
  <header className="mx-auto max-w-lg px-5 pt-[max(12px,env(safe-area-inset-top))]">
    <div className="-ml-2.5 flex min-h-11 items-center justify-between gap-3">
      <Button variant="ghost" onClick={onBack} className="gap-0.5 pl-1.5 pr-3.5 text-primary">
        <ChevronLeft className="h-5 w-5" aria-hidden />
        Back
      </Button>
      {right}
    </div>
    <h1 className="mb-2 mt-2 text-date font-semibold text-foreground">{title}</h1>
  </header>
);

export default PageHeader;
