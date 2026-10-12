import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CircularProgress from "@/components/CircularProgress";
import WeeklyChart from "@/components/WeeklyChart";
import LogReadingDialog from "@/components/LogReadingDialog";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import CreateCampaignDialog from "@/components/CreateCampaignDialog";
import TodayReadingCard from "@/components/home/TodayReadingCard";
import CatchUpCard from "@/components/home/CatchUpCard";
import PlanEndedCard from "@/components/home/PlanEndedCard";
import AppMenu from "@/components/AppMenu";
import TodayCard from "@/components/TodayCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Flame, Target, Menu, TrendingUp, RefreshCw } from "lucide-react";
import { getSurahForPage, TOTAL_PAGES } from "@/lib/quran-data";
import { format, subDays, isToday, parseISO, isPast, endOfDay } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useReadingLogs } from "@/hooks/useReadingLogs";
import { dueMilestones, loadShownMilestones, saveShownMilestones } from "@/lib/milestones";
import { dailyPace, daysInclusive, displayPage, pagesBehind } from "@/lib/plan";
import { dismissCatchUp, isCatchUpDismissed } from "@/lib/catch-up";

const Index = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [logOpen, setLogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [catchUpDismissedId, setCatchUpDismissedId] = useState<string | null>(null);

  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
  const { data: logs = [], isLoading: logsLoading } = useReadingLogs();

  const isLoading = campaignsLoading || logsLoading;

  // Auto-select active campaign
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaignId) {
      const active = campaigns.find((c) => c.is_active) || campaigns[0];
      if (active) setSelectedCampaignId(active.id);
    }
  }, [campaigns, selectedCampaignId]);

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns.find((c) => c.is_active) || campaigns[0] || null;
  const campaignEndDate = useMemo(
    () => (activeCampaign ? endOfDay(parseISO(activeCampaign.end_date)) : null),
    [activeCampaign]
  );
  const isCampaignExpired = useMemo(() => (campaignEndDate ? isPast(campaignEndDate) : false), [campaignEndDate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    await queryClient.invalidateQueries({ queryKey: ["reading_logs"] });
    await queryClient.invalidateQueries({ queryKey: ["profile_name"] });
    setIsRefreshing(false);
  };

  const handleDataChange = () => {
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["reading_logs"] });
    queryClient.invalidateQueries({ queryKey: ["profile_name"] });
  };

  const switchCampaign = async (campaignId: string) => {
    if (!user) return;
    setSelectedCampaignId(campaignId);
    await supabase.from("campaigns").update({ is_active: false }).eq("user_id", user.id);
    await supabase.from("campaigns").update({ is_active: true }).eq("id", campaignId);
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  // Computed stats — derived from the full log history, so this only
  // re-scans when the inputs actually change rather than on every render
  // (menu toggles, refresh spinner, etc).
  const {
    campaignLogs,
    pagesRead,
    percentage,
    lastPageMarker,
    pagesReadToday,
    daysRemaining,
    dailyTarget,
    pagesRemaining,
    behind,
    streak,
    chartData7,
    chartData30,
  } = useMemo(() => {
    const chartEndDate = campaignEndDate && isCampaignExpired ? campaignEndDate : new Date();
    const campaignLogs = activeCampaign
      ? logs.filter((l) => l.campaign_id === activeCampaign.id && (!campaignEndDate || parseISO(l.created_at) <= campaignEndDate))
      : [];
    const totalPages = activeCampaign ? activeCampaign.end_page - activeCampaign.start_page + 1 : TOTAL_PAGES;
    const pagesRead = campaignLogs.reduce((sum, l) => sum + l.pages_read, 0);
    const percentage = totalPages > 0 ? (pagesRead / totalPages) * 100 : 0;
    const lastLog = campaignLogs[0];
    const lastPageMarker = lastLog?.current_page_marker ?? activeCampaign?.start_page ?? 1;
    const todayLogs = campaignLogs.filter((l) => isToday(parseISO(l.created_at)));
    const pagesReadToday = todayLogs.reduce((sum, l) => sum + l.pages_read, 0);
    const daysRemaining = activeCampaign ? daysInclusive(new Date(), parseISO(activeCampaign.end_date)) : 1;
    const pagesRemaining = totalPages - pagesRead;
    const dailyTarget = isCampaignExpired ? 0 : dailyPace(pagesRemaining, daysRemaining);
    const behind = activeCampaign
      ? pagesBehind({
          totalPages,
          pagesRead,
          startDate: parseISO(activeCampaign.start_date),
          endDate: parseISO(activeCampaign.end_date),
          today: new Date(),
        })
      : 0;

    let streak = 0;
    if (campaignLogs.length > 0) {
      const logDays = new Set(campaignLogs.map((l) => format(parseISO(l.created_at), "yyyy-MM-dd")));
      let checkDate = chartEndDate;
      while (logDays.has(format(checkDate, "yyyy-MM-dd"))) {
        streak++;
        checkDate = subDays(checkDate, 1);
      }
    }

    const buildChartData = (days: number, labelFormat: string) =>
      Array.from({ length: days }, (_, i) => {
        const date = subDays(chartEndDate, days - 1 - i);
        const dayStr = format(date, "yyyy-MM-dd");
        const dayLogs = campaignLogs.filter((l) => format(parseISO(l.created_at), "yyyy-MM-dd") === dayStr);
        return { day: format(date, labelFormat), pages: dayLogs.reduce((sum, l) => sum + l.pages_read, 0) };
      });

    return {
      campaignLogs,
      pagesRead,
      percentage,
      lastPageMarker,
      pagesReadToday,
      daysRemaining,
      dailyTarget,
      pagesRemaining: Math.max(0, pagesRemaining),
      behind,
      streak,
      chartData7: buildChartData(7, "EEE"),
      chartData30: buildChartData(30, "d MMM"),
    };
  }, [activeCampaign, logs, campaignEndDate, isCampaignExpired]);

  // Milestone toasts, each shown once per reading plan on this device
  useEffect(() => {
    if (!activeCampaign || isLoading) return;
    const shown = loadShownMilestones(activeCampaign.id);
    const { show, markShown } = dueMilestones(streak, percentage, shown);
    if (markShown.length === 0) return;
    saveShownMilestones(activeCampaign.id, new Set([...shown, ...markShown]));
    for (const m of show) {
      toast.success(m.message, m.key === "complete" ? { duration: 8000 } : undefined);
    }
  }, [streak, percentage, activeCampaign, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-lg px-4 pb-24 pt-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-8" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-[180px] w-full rounded-md" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // No reading plan on this device (new, or every plan deleted): set one up.
  if (campaigns.length === 0) {
    return <OnboardingFlow onComplete={() => setSelectedCampaignId(null)} />;
  }

  // "Start a new plan": the set-up flow without the welcome screen.
  if (newPlanOpen) {
    return (
      <OnboardingFlow
        startAt="goal"
        onExit={() => setNewPlanOpen(false)}
        onComplete={() => {
          setNewPlanOpen(false);
          setSelectedCampaignId(null);
        }}
      />
    );
  }

  const isComplete = percentage >= 100;
  const hasLogs = campaignLogs.length > 0;
  const showFirstLog = !!activeCampaign && !isCampaignExpired && !hasLogs;
  const showCatchUp =
    !!activeCampaign &&
    !isCampaignExpired &&
    hasLogs &&
    !isComplete &&
    behind >= 1 &&
    catchUpDismissedId !== activeCampaign.id &&
    !isCatchUpDismissed(activeCampaign.id);
  const showPlanEnded = !!activeCampaign && isCampaignExpired && !isComplete;
  const onPage = activeCampaign ? displayPage(lastPageMarker, activeCampaign.end_page) : lastPageMarker;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold tracking-tight">Quran Daily</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            {campaigns.length > 1 && (
              <Select value={selectedCampaignId || ""} onValueChange={switchCampaign}>
                <SelectTrigger className="w-auto max-w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-24 pt-6 space-y-6">
        {showCatchUp && activeCampaign && (
          <CatchUpCard
            pagesBehind={behind}
            dailyTarget={dailyTarget}
            endDate={parseISO(activeCampaign.end_date)}
            onLog={() => setLogOpen(true)}
            onDismiss={() => {
              dismissCatchUp(activeCampaign.id);
              setCatchUpDismissedId(activeCampaign.id);
            }}
          />
        )}

        {showPlanEnded && activeCampaign && (
          <PlanEndedCard
            endDate={parseISO(activeCampaign.end_date)}
            page={onPage}
            endPage={activeCampaign.end_page}
            percentage={percentage}
            pagesRemaining={pagesRemaining}
            wholeQuran={activeCampaign.start_page === 1 && activeCampaign.end_page === TOTAL_PAGES}
            onExtend={() => setExtendOpen(true)}
            onNewPlan={() => setNewPlanOpen(true)}
          />
        )}

        <TodayCard />

        {showFirstLog && (
          <TodayReadingCard pagesToday={pagesReadToday} dailyTarget={dailyTarget} onLog={() => setLogOpen(true)} />
        )}

        {activeCampaign && (
          <>
            <div className="flex flex-col items-center space-y-2">
              <CircularProgress percentage={percentage} />
              <p className="text-sm text-muted-foreground">
                Page {onPage}, {getSurahForPage(onPage)}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeCampaign.title} · {isCampaignExpired
                  ? `ended ${format(parseISO(activeCampaign.end_date), "d MMM")}`
                  : `ends ${format(parseISO(activeCampaign.end_date), "d MMM")} · ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{pagesReadToday}</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{pagesRead}</p>
                    <p className="text-xs text-muted-foreground">Total read</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{isCampaignExpired ? "–" : dailyTarget}</p>
                    <p className="text-xs text-muted-foreground">Pages/day</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Flame className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{streak}</p>
                    <p className="text-xs text-muted-foreground">Day streak</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <WeeklyChart data7={chartData7} data30={chartData30} />
          </>
        )}
      </main>

      {activeCampaign && !isCampaignExpired && !showFirstLog && (
        <button
          onClick={() => setLogOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Log reading"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <AppMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <CreateCampaignDialog
        open={extendOpen}
        onOpenChange={setExtendOpen}
        onCreated={handleDataChange}
        campaign={activeCampaign}
        focusEndDate
      />
      <LogReadingDialog open={logOpen} onOpenChange={setLogOpen} campaign={activeCampaign} lastPageMarker={lastPageMarker} onLogged={handleDataChange} />
    </div>
  );
};

export default Index;
