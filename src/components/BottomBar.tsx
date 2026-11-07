import { useNavigate } from "react-router-dom";
import { CalendarDays, ChartLine, House, Plus, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPEN_LOG } from "@/lib/nav";

type Tab = "home" | "progress" | "calendar" | "settings";

const TABS: { tab: Tab; path: string; label: string; icon: LucideIcon }[] = [
  { tab: "home", path: "/", label: "Home", icon: House },
  { tab: "progress", path: "/progress", label: "Progress", icon: ChartLine },
  { tab: "calendar", path: "/calendar", label: "Calendar", icon: CalendarDays },
  { tab: "settings", path: "/settings", label: "Settings", icon: Settings },
];

interface BottomBarProps {
  current: Tab;
  /** What the Log button does on Home. Elsewhere it opens Home with the log sheet. */
  onLog?: () => void;
}

/** The app's main places (as WalletKu's tab bar), with a raised round Log button in the
 *  middle: Home · Progress · Log · Calendar · Settings. */
const BottomBar = ({ current, onLog }: BottomBarProps) => {
  const navigate = useNavigate();
  const log = onLog ?? (() => navigate("/", { state: OPEN_LOG }));

  const tab = ({ tab, path, label, icon: Icon }: (typeof TABS)[number]) => (
    <button
      key={tab}
      type="button"
      onClick={() => tab !== current && navigate(path)}
      aria-current={tab === current ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-1 text-caption font-medium",
        tab === current ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  );

  return (
    <nav
      aria-label="Quran Daily"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg items-end border-t border-border bg-card px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2"
    >
      {TABS.slice(0, 2).map(tab)}
      <div className="flex flex-1 flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={log}
          aria-label="Log reading"
          className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float ring-4 ring-background transition-transform active:scale-95"
        >
          <Plus className="h-7 w-7" aria-hidden />
        </button>
        <span aria-hidden className="pb-1 text-caption font-medium text-muted-foreground">
          Log
        </span>
      </div>
      {TABS.slice(2).map(tab)}
    </nav>
  );
};

export default BottomBar;
