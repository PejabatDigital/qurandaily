import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, History } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomBar from "@/components/BottomBar";
import WeeklyChart from "@/components/WeeklyChart";
import PaceCard from "@/components/progress/PaceCard";
import ReadingCalendar from "@/components/progress/ReadingCalendar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useReadingLogs } from "@/hooks/useReadingLogs";
import { planSummary } from "@/lib/progress";
import { BAR_SPACE } from "@/lib/nav";

/** How the active reading plan is going: pace, the days read (with streaks) and the
 *  pages read each day. Reading history (edit and delete logs) is linked at the end. */
const Progress = () => {
  const navigate = useNavigate();
  const { data: campaigns = [], isLoading: plansLoading } = useCampaigns();
  const { data: logs = [], isLoading: logsLoading } = useReadingLogs();
  const plan = campaigns.find((c) => c.is_active) ?? campaigns[0] ?? null;
  const today = useMemo(() => new Date(), []);
  const summary = useMemo(() => (plan ? planSummary(plan, logs, today) : null), [plan, logs, today]);

  let content;
  if (plansLoading || logsLoading) {
    content = (
      <>
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </>
    );
  } else if (!plan || !summary) {
    content = (
      <div className="space-y-4 rounded-2xl bg-card p-5 text-center">
        <p className="text-body text-muted-foreground">Set up a reading plan to see your progress here.</p>
        <Button onClick={() => navigate("/")}>Set up a reading plan</Button>
      </div>
    );
  } else {
    content = (
      <>
        <PaceCard plan={plan} summary={summary} today={today} />
        <ReadingCalendar plan={plan} summary={summary} today={today} />
        <WeeklyChart activity={summary.activity} />
        <button
          type="button"
          onClick={() => navigate("/history")}
          className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl bg-card px-4 text-left transition-colors active:bg-subtle"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-subtle text-muted-foreground">
            <History className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <span className="flex-1 text-label font-medium text-foreground">Reading history</span>
          <ChevronRight className="h-4 w-4 text-faint" aria-hidden />
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Progress" />
      <main className={`mx-auto max-w-lg space-y-4 px-5 pt-2 ${BAR_SPACE}`}>{content}</main>
      <BottomBar current="progress" />
    </div>
  );
};

export default Progress;
