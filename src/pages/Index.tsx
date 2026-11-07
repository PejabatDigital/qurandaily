import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import CircularProgress from "@/components/CircularProgress";
import LogReadingDialog from "@/components/LogReadingDialog";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import CreateCampaignDialog from "@/components/CreateCampaignDialog";
import TodayReadingCard from "@/components/home/TodayReadingCard";
import CatchUpCard from "@/components/home/CatchUpCard";
import PlanEndedCard from "@/components/home/PlanEndedCard";
import FirstLogSheet, { type FirstLog } from "@/components/home/FirstLogSheet";
import KhatamCelebration, { type Completion } from "@/components/home/KhatamCelebration";
import BottomBar from "@/components/BottomBar";
import { BAR_SPACE } from "@/lib/nav";
import TodayCard from "@/components/TodayCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Flame, Target, TrendingUp, RefreshCw } from "lucide-react";
import { getSurahForPage, TOTAL_PAGES } from "@/lib/quran-data";
import { format, parseISO, isPast, endOfDay } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useReadingLogs } from "@/hooks/useReadingLogs";
import { dueMilestones, markMilestonesShown, shownMilestones } from "@/lib/milestones";
import { bestStreak, daysInclusive, displayPage, isKhatamPlan, pagesBehind, todayTarget } from "@/lib/plan";
import { dismissCatchUp, isCatchUpDismissed } from "@/lib/catch-up";
import { planSummary } from "@/lib/progress";

const Index = () => {
  const queryClient = useQueryClient();
  const [logOpen, setLogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [catchUpDismissedId, setCatchUpDismissedId] = useState<string | null>(null);
  const [firstLog, setFirstLog] = useState<FirstLog | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);

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
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    setIsRefreshing(false);
  };

  const handleDataChange = () => {
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["reading_logs"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  // Making a plan active switches the others off (on the server).
  const switchCampaign = async (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    try {
      await api.updateCampaign(campaignId, { is_active: true });
    } catch (e) {
      toast({ title: "Couldn't switch reading plan", description: (e as Error).message, variant: "destructive" });
    }
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  // Stats for the plan on show (lib/progress.ts, shared with Progress), plus Home's own:
  // where the reader is, today's target and the catch-up gap.
  const {
    campaignLogs,
    pagesRead,
    percentage,
    lastPageMarker,
    pagesReadToday,
    daysRemaining,
    dailyTarget,
    pagesRemaining,
    totalPages,
    behind,
    streak,
  } = useMemo(() => {
    const now = new Date();
    const summary = activeCampaign ? planSummary(activeCampaign, logs, now) : null;
    const campaignLogs = summary?.logs ?? [];
    const totalPages = summary?.totalPages ?? TOTAL_PAGES;
    const pagesRead = summary?.pagesRead ?? 0;
    const pagesReadToday = summary?.pagesReadToday ?? 0;
    const lastPageMarker = campaignLogs[0]?.current_page_marker ?? activeCampaign?.start_page ?? 1;
    const daysRemaining = activeCampaign ? daysInclusive(now, parseISO(activeCampaign.end_date)) : 1;
    const dailyTarget = isCampaignExpired ? 0 : todayTarget({ totalPages, pagesRead, pagesReadToday, daysRemaining });
    const behind = activeCampaign
      ? pagesBehind({
          totalPages,
          pagesRead,
          startDate: parseISO(activeCampaign.start_date),
          endDate: parseISO(activeCampaign.end_date),
          today: now,
        })
      : 0;
    return {
      campaignLogs,
      pagesRead,
      percentage: summary?.percentage ?? 0,
      lastPageMarker,
      pagesReadToday,
      daysRemaining,
      dailyTarget,
      pagesRemaining: Math.max(0, totalPages - pagesRead),
      totalPages,
      behind,
      streak: summary?.streak ?? 0,
    };
  }, [activeCampaign, logs, isCampaignExpired]);

  // Milestones, each shown once per reading plan (remembered on the account).
  // Reaching 100% gets the full-screen celebration instead of a toast.
  useEffect(() => {
    if (!activeCampaign || isLoading) return;
    const { show, markShown } = dueMilestones(streak, percentage, shownMilestones(activeCampaign));
    if (markShown.length === 0) return;
    markMilestonesShown(activeCampaign.id, markShown);
    for (const m of show) {
      if (m.key === "complete") {
        const finishedOn = campaignLogs[0] ? parseISO(campaignLogs[0].created_at) : new Date();
        setCompletion({
          khatam: isKhatamPlan(activeCampaign),
          pages: totalPages,
          days: daysInclusive(parseISO(activeCampaign.start_date), finishedOn),
          bestStreak: bestStreak(campaignLogs.map((l) => parseISO(l.created_at))),
        });
      } else {
        toast({ title: m.message });
      }
    }
  }, [streak, percentage, activeCampaign, isLoading, campaignLogs, totalPages]);

  // The bar's Log button: an ended plan can't take new readings (they'd fall after its
  // finish date), so say what to do instead.
  const startLog = () => {
    if (isCampaignExpired) {
      toast({ title: "This reading plan has ended", description: "Extend the finish date or start a new plan to keep logging." });
      return;
    }
    setLogOpen(true);
  };

  // The Log button on another tab opens Home with { log: true } (BottomBar's OPEN_LOG).
  const location = useLocation();
  const navigate = useNavigate();
  const wantsLog = (location.state as { log?: boolean } | null)?.log === true;
  useEffect(() => {
    if (!wantsLog || isLoading) return;
    navigate(".", { replace: true, state: null });
    if (campaigns.length > 0) startLog();
    // startLog only reads isCampaignExpired, which is settled once loading is done.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsLog, isLoading]);

  const handleLogged = (logged: { pagesRead: number; nextMarker: number }) => {
    // The very first log on a plan gets a celebration sheet instead of the
    // toast, unless it finishes the plan outright (that has its own screen).
    if (activeCampaign && campaignLogs.length === 0 && logged.pagesRead < totalPages) {
      setFirstLog({
        pagesRead: logged.pagesRead,
        page: displayPage(logged.nextMarker, activeCampaign.end_page),
        remainingToday: Math.max(0, dailyTarget - logged.pagesRead),
      });
    }
    handleDataChange();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-lg space-y-4 px-5 pb-32 pt-2">
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
                  <Skeleton className="h-9 w-9 rounded-xl" />
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
              <Skeleton className="h-[180px] w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // No reading plan yet (new account, or every plan deleted): set one up.
  if (campaigns.length === 0) {
    return <OnboardingFlow onComplete={() => setSelectedCampaignId(null)} />;
  }

  if (completion) {
    return (
      <KhatamCelebration
        completion={completion}
        onStartNext={() => {
          setCompletion(null);
          setNewPlanOpen(true);
        }}
        onHome={() => setCompletion(null)}
      />
    );
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
      <header className="sticky top-0 z-40 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          <h1 className="text-heading font-semibold">Quran Daily</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="bg-card" onClick={handleRefresh} disabled={isRefreshing} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            {campaigns.length > 1 && (
              <Select value={selectedCampaignId || ""} onValueChange={switchCampaign}>
                <SelectTrigger className="h-10 w-auto max-w-[160px] rounded-full bg-card text-label font-medium">
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

      <main className={`mx-auto max-w-lg space-y-4 px-5 pt-2 ${BAR_SPACE}`}>
        {showCatchUp && activeCampaign && (
          <CatchUpCard
            pagesBehind={behind}
            dailyTarget={dailyTarget}
            endDate={parseISO(activeCampaign.end_date)}
            onLog={startLog}
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
          <TodayReadingCard pagesToday={pagesReadToday} dailyTarget={dailyTarget} onLog={startLog} />
        )}

        {activeCampaign && (
          <>
            <div className="flex flex-col items-center space-y-2 py-2">
              <CircularProgress percentage={percentage} />
              <p className="text-body text-muted-foreground">
                Page {onPage}, {getSurahForPage(onPage)}
              </p>
              <p className="text-small text-muted-foreground">
                {activeCampaign.title} · {isCampaignExpired
                  ? `ended ${format(parseISO(activeCampaign.end_date), "d MMM")}`
                  : `ends ${format(parseISO(activeCampaign.end_date), "d MMM")} · ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-title font-semibold">{pagesReadToday}</p>
                    <p className="text-small text-muted-foreground">Today</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-title font-semibold">{pagesRead}</p>
                    <p className="text-small text-muted-foreground">Total read</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-title font-semibold">{isCampaignExpired ? "–" : dailyTarget}</p>
                    <p className="text-small text-muted-foreground">Pages/day</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
                    <Flame className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-title font-semibold">{streak}</p>
                    <p className="text-small text-muted-foreground">Day streak</p>
                  </div>
                </CardContent>
              </Card>
            </div>

          </>
        )}
      </main>

      <BottomBar current="home" onLog={startLog} />
      <CreateCampaignDialog
        open={extendOpen}
        onOpenChange={setExtendOpen}
        onCreated={handleDataChange}
        campaign={activeCampaign}
        focusEndDate
      />
      <LogReadingDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        campaign={activeCampaign}
        lastPageMarker={lastPageMarker}
        onLogged={handleLogged}
        quiet={campaignLogs.length === 0}
      />
      <FirstLogSheet log={firstLog} onClose={() => setFirstLog(null)} />
    </div>
  );
};

export default Index;
