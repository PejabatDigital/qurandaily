import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import CircularProgress from "@/components/CircularProgress";
import WeeklyChart from "@/components/WeeklyChart";
import LogReadingDialog from "@/components/LogReadingDialog";
import CreateCampaignDialog from "@/components/CreateCampaignDialog";
import OnboardingDialog from "@/components/OnboardingDialog";
import AppMenu from "@/components/AppMenu";
import TodayCard from "@/components/TodayCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Flame, Target, BookMarked, Menu, TrendingUp, RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { getSurahForPage, TOTAL_PAGES } from "@/lib/quran-data";
import { format, subDays, differenceInDays, isToday, parseISO, isPast, endOfDay } from "date-fns";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const STREAK_MILESTONES: Record<number, string> = {
  7: "🎉 One week strong! Consistency is key.",
  30: "🌟 A full month of consistency! Amazing dedication.",
  100: "🏆 100 days — truly remarkable. MashaAllah!",
};

const PROGRESS_MILESTONES: Record<number, string> = {
  25: "📖 Quarter of the way there!",
  50: "🌙 Halfway through! Keep going.",
  75: "✨ The finish line is near!",
};

const Index = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [logOpen, setLogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const milestonesShown = useRef(new Set<string>());

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["reading_logs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("reading_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  const { data: displayName } = useQuery({
    queryKey: ["profile_name", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
      return data?.display_name || null;
    },
    enabled: !!user,
  });

  const isLoading = campaignsLoading || logsLoading;

  // Show onboarding for new users
  useEffect(() => {
    if (!isLoading && campaigns.length === 0 && !displayName) {
      setShowOnboarding(true);
    }
  }, [isLoading, campaigns.length, displayName]);

  // Auto-select active campaign
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaignId) {
      const active = campaigns.find((c) => c.is_active) || campaigns[0];
      if (active) setSelectedCampaignId(active.id);
    }
  }, [campaigns, selectedCampaignId]);

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns.find((c) => c.is_active) || campaigns[0] || null;
  const campaignEndDate = activeCampaign ? endOfDay(parseISO(activeCampaign.end_date)) : null;
  const isCampaignExpired = campaignEndDate ? isPast(campaignEndDate) : false;
  const chartEndDate = campaignEndDate && isCampaignExpired ? campaignEndDate : new Date();

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

  // Computed stats
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
  const daysRemaining = activeCampaign ? Math.max(1, differenceInDays(parseISO(activeCampaign.end_date), new Date()) + 1) : 1;
  const pagesRemaining = totalPages - pagesRead;
  const dailyTarget = isCampaignExpired ? 0 : Math.ceil(Math.max(0, pagesRemaining) / daysRemaining);

  // Streak
  let streak = 0;
  if (campaignLogs.length > 0) {
    const logDays = new Set(campaignLogs.map((l) => format(parseISO(l.created_at), "yyyy-MM-dd")));
    let checkDate = chartEndDate;
    while (logDays.has(format(checkDate, "yyyy-MM-dd"))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }
  }

  // Milestone toasts (once per session)
  useEffect(() => {
    if (!activeCampaign || isLoading) return;
    const shown = milestonesShown.current;

    // Streak milestones
    if (STREAK_MILESTONES[streak] && !shown.has(`streak-${streak}`)) {
      shown.add(`streak-${streak}`);
      toast.success(STREAK_MILESTONES[streak]);
    }

    // Progress milestones
    const pct = Math.floor(percentage);
    for (const threshold of [25, 50, 75]) {
      if (pct >= threshold && !shown.has(`progress-${threshold}`)) {
        shown.add(`progress-${threshold}`);
        toast.success(PROGRESS_MILESTONES[threshold]);
      }
    }

    // 100% completion
    if (pct >= 100 && !shown.has("complete")) {
      shown.add("complete");
      toast.success("🎊 You've completed your campaign! SubhanAllah!", { duration: 8000 });
    }
  }, [streak, percentage, activeCampaign, isLoading]);


  // Chart data
  const buildChartData = (days: number, labelFormat: string) =>
    Array.from({ length: days }, (_, i) => {
      const date = subDays(chartEndDate, days - 1 - i);
      const dayStr = format(date, "yyyy-MM-dd");
      const dayLogs = campaignLogs.filter((l) => format(parseISO(l.created_at), "yyyy-MM-dd") === dayStr);
      return { day: format(date, labelFormat), pages: dayLogs.reduce((sum, l) => sum + l.pages_read, 0) };
    });

  const chartData7 = buildChartData(7, "EEE");
  const chartData30 = buildChartData(30, "d MMM");

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold tracking-tight">Quran Daily</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="h-8 w-8">
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
        <TodayCard />

        {campaigns.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookMarked className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">No campaigns yet</p>
              <p className="text-xs text-muted-foreground mb-4">Create your first reading goal to get started.</p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>Create Campaign</Button>
            </CardContent>
          </Card>
        )}

        {activeCampaign && (
          <>
            <div className="flex flex-col items-center space-y-2">
              <CircularProgress percentage={percentage} />
              <p className="text-sm text-muted-foreground">
                Page {lastPageMarker} — <span className="font-medium">{getSurahForPage(lastPageMarker)}</span>
              </p>
              <p className={`flex items-center gap-1.5 text-xs ${isCampaignExpired ? "text-destructive" : "text-muted-foreground/80"}`}>
                {isCampaignExpired ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                <span>
                  {activeCampaign.title} · {isCampaignExpired
                    ? `Ended ${format(parseISO(activeCampaign.end_date), "MMM d, yyyy")}`
                    : `Ends ${format(parseISO(activeCampaign.end_date), "MMM d")} · ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`}
                </span>
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
                    <p className="text-xs text-muted-foreground">Total Read</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{dailyTarget}</p>
                    <p className="text-xs text-muted-foreground">Pages/Day</p>
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
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <WeeklyChart data7={chartData7} data30={chartData30} />
          </>
        )}
      </main>

      {activeCampaign && !isCampaignExpired && (
        <button
          onClick={() => setLogOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Log reading"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <AppMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <LogReadingDialog open={logOpen} onOpenChange={setLogOpen} campaign={activeCampaign} lastPageMarker={lastPageMarker} onLogged={handleDataChange} />
      <CreateCampaignDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleDataChange} />
      <OnboardingDialog open={showOnboarding} onOpenChange={setShowOnboarding} onComplete={handleDataChange} />
    </div>
  );
};

export default Index;
