import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

const data = vi.hoisted(() => ({
  campaigns: [] as Tables<"campaigns">[],
  logs: [] as Tables<"reading_logs">[],
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: {}, loading: false, error: null }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  },
}));
vi.mock("@/hooks/useCampaigns", () => ({ useCampaigns: () => ({ data: data.campaigns, isLoading: false }) }));
vi.mock("@/hooks/useReadingLogs", () => ({ useReadingLogs: () => ({ data: data.logs, isLoading: false }) }));
vi.mock("@/components/TodayCard", () => ({ default: () => null }));
vi.mock("@/components/WeeklyChart", () => ({ default: () => null }));
vi.mock("@/components/AppMenu", () => ({ default: () => null }));

import Index from "@/pages/Index";

const plan = (patch: Partial<Tables<"campaigns">> = {}): Tables<"campaigns"> => ({
  id: "plan-1",
  user_id: "user-1",
  title: "Full Quran (khatam)",
  start_page: 1,
  end_page: 604,
  start_date: "2026-10-01",
  end_date: "2026-10-30",
  is_active: true,
  created_at: "2026-10-01T01:00:00Z",
  updated_at: "2026-10-01T01:00:00Z",
  ...patch,
});

const log = (pages: number, marker: number, createdAt: string): Tables<"reading_logs"> => ({
  id: `log-${createdAt}`,
  user_id: "user-1",
  campaign_id: "plan-1",
  pages_read: pages,
  current_page_marker: marker,
  created_at: createdAt,
});

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Index />
    </QueryClientProvider>,
  );
}

// The floating + button (the catch-up card has a "Log reading" button too).
const logButtons = () => screen.queryAllByRole("button", { name: "Log reading" });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 12, 9, 30));
  localStorage.clear();
  data.campaigns = [];
  data.logs = [];
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Home", () => {
  it("shows onboarding when there's no reading plan", () => {
    renderHome();
    expect(screen.getByText("Read a little, every day")).toBeInTheDocument();
  });

  it("prompts for the first log and hides the floating button", () => {
    data.campaigns = [plan({ start_date: "2026-10-12", end_date: "2026-11-10" })];
    renderHome();
    expect(screen.getByText("Today's reading")).toBeInTheDocument();
    expect(screen.getByText("0 of 21 pages")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log your first reading/ })).toBeInTheDocument();
    expect(logButtons()).toHaveLength(0);
    expect(screen.getByText("Page 1, Al-Fatihah")).toBeInTheDocument();
    expect(screen.getByText("Full Quran (khatam) · ends 10 Nov · 30 days left")).toBeInTheDocument();
  });

  it("shows a calm catch-up card when behind, dismissable for the day", () => {
    // 1–30 Oct plan; by the end of 11 Oct 221 pages were due, 141 read.
    data.campaigns = [plan()];
    data.logs = [log(141, 142, "2026-10-08T03:00:00Z")];
    renderHome();
    expect(screen.getByText("Welcome back. You're 80 pages behind.")).toBeInTheDocument();
    // 463 pages left over 19 days (12–30 Oct)
    expect(screen.getByText("No pressure: 25 pages a day still gets you there by 30 Oct.")).toBeInTheDocument();
    expect(screen.queryByText("Today's reading")).not.toBeInTheDocument();
    expect(logButtons()).toHaveLength(2); // card button and floating button

    fireEvent.click(screen.getByRole("button", { name: "Dismiss for today" }));
    expect(screen.queryByText(/pages behind/)).not.toBeInTheDocument();
    cleanup();
    renderHome();
    expect(screen.queryByText(/pages behind/)).not.toBeInTheDocument();
  });

  it("doesn't nag when on track", () => {
    data.campaigns = [plan()];
    data.logs = [log(230, 231, "2026-10-11T03:00:00Z")];
    renderHome();
    expect(screen.queryByText(/pages behind/)).not.toBeInTheDocument();
  });

  it("offers to extend or start again once the plan has ended", () => {
    data.campaigns = [plan({ start_date: "2026-09-12", end_date: "2026-10-10" })];
    data.logs = [log(479, 480, "2026-10-09T03:00:00Z")];
    renderHome();
    expect(screen.getByText("Your plan ended on 10 Oct")).toBeInTheDocument();
    expect(
      screen.getByText("You reached page 480 of 604. That's 79% of the Quran. 125 pages to go."),
    ).toBeInTheDocument();
    expect(screen.getByText("Full Quran (khatam) · ended 10 Oct")).toBeInTheDocument();
    expect(screen.getByText("–")).toBeInTheDocument();
    expect(logButtons()).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Extend finish date" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("End Date")).toHaveFocus();
  });

  it("opens set-up at the goal step for a new plan, and back returns home", () => {
    data.campaigns = [plan({ start_date: "2026-09-12", end_date: "2026-10-10" })];
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: "Start a new plan" }));
    expect(screen.getByText("What would you like to read?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText(/Your plan ended on/)).toBeInTheDocument();
  });

  it('says "of your plan" for plans that aren\'t the whole Quran', () => {
    data.campaigns = [plan({ title: "Juz Amma (Juz 30)", start_page: 582, start_date: "2026-09-12", end_date: "2026-10-10" })];
    data.logs = [log(10, 592, "2026-10-09T03:00:00Z")];
    renderHome();
    expect(screen.getByText(/That's 43% of your plan\. 13 pages to go\./)).toBeInTheDocument();
  });
});
