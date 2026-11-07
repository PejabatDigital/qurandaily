import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { Campaign, ReadingLog } from "@/lib/api-types";

const data = vi.hoisted(() => ({
  campaigns: [] as Campaign[],
  logs: [] as ReadingLog[],
  milestonesSaved: [] as { id: string; keys: string[] }[],
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "reader@example.com" }, loading: false, error: null }),
}));
vi.mock("@/lib/api", () => ({
  api: {
    profile: async () => ({ email: "reader@example.com", display_name: null, prayer_zone: null }),
    createCampaign: async () => ({}),
    updateCampaign: async () => ({}),
    createLog: async (values: unknown) => values,
    markMilestonesShown: async (id: string, keys: string[]) => {
      data.milestonesSaved.push({ id, keys });
      return { ok: true };
    },
  },
}));
vi.mock("@/hooks/useCampaigns", () => ({ useCampaigns: () => ({ data: data.campaigns, isLoading: false }) }));
vi.mock("@/hooks/useReadingLogs", () => ({ useReadingLogs: () => ({ data: data.logs, isLoading: false }) }));
vi.mock("@/components/TodayCard", () => ({ default: () => null }));
vi.mock("@/components/WeeklyChart", () => ({ default: () => null }));

import Index from "@/pages/Index";
import { Toaster } from "@/components/ui/toaster";
import { OPEN_LOG } from "@/lib/nav";

const plan = (patch: Partial<Campaign> = {}): Campaign => ({
  id: "plan-1",
  user_id: "user-1",
  title: "Full Quran (khatam)",
  start_page: 1,
  end_page: 604,
  start_date: "2026-10-01",
  end_date: "2026-10-30",
  is_active: true,
  milestones_shown: [],
  created_at: "2026-10-01T01:00:00Z",
  updated_at: "2026-10-01T01:00:00Z",
  ...patch,
});

const log = (pages: number, marker: number, createdAt: string): ReadingLog => ({
  id: `log-${createdAt}`,
  user_id: "user-1",
  campaign_id: "plan-1",
  pages_read: pages,
  current_page_marker: marker,
  created_at: createdAt,
});

function renderHome({ withToasts = false, openLog = false } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      {/* Before the page, as in App, so it's listening when the page shows a toast. */}
      {withToasts && <Toaster />}
      <MemoryRouter initialEntries={[{ pathname: "/", state: openLog ? OPEN_LOG : null }]}>
        <Index />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// The bottom bar's round + (the catch-up card has a "Log reading" button too).
const logButtons = () => screen.queryAllByRole("button", { name: "Log reading" });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 12, 9, 30));
  localStorage.clear();
  data.campaigns = [];
  data.logs = [];
  data.milestonesSaved = [];
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

  it("prompts for the first log", () => {
    data.campaigns = [plan({ start_date: "2026-10-12", end_date: "2026-11-10" })];
    renderHome();
    expect(screen.getByText("Today's reading")).toBeInTheDocument();
    expect(screen.getByText("0 of 21 pages")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log your first reading/ })).toBeInTheDocument();
    expect(logButtons()).toHaveLength(1); // the bar's
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
    expect(logButtons()).toHaveLength(2); // card button and the bar's

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

  it("celebrates the first log with a sheet instead of a toast", async () => {
    data.campaigns = [plan({ start_date: "2026-10-12", end_date: "2026-11-10" })];
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /Log your first reading/ }));
    fireEvent.change(screen.getByLabelText("How many pages did you read?"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("First reading logged")).toBeInTheDocument();
    expect(screen.getByText("5 pages. You're now on page 6, Al-Baqarah.")).toBeInTheDocument();
    expect(screen.getByText("Day 1 of your streak")).toBeInTheDocument();
    expect(screen.getByText("16 more pages today keeps you on track.")).toBeInTheDocument();
    expect(screen.queryByText("Logged!")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByText("First reading logged")).not.toBeInTheDocument());
  });

  it("hides the on-track line when the first log meets today's target", async () => {
    data.campaigns = [plan({ start_date: "2026-10-12", end_date: "2026-11-10" })];
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /Log your first reading/ }));
    fireEvent.change(screen.getByLabelText("How many pages did you read?"), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("First reading logged")).toBeInTheDocument();
    expect(screen.queryByText(/keeps you on track/)).not.toBeInTheDocument();
  });

  it("celebrates a completed khatam once", () => {
    data.campaigns = [plan({ start_date: "2026-09-13", end_date: "2026-10-30" })];
    data.logs = [
      log(304, 605, "2026-10-12T01:00:00Z"),
      log(100, 301, "2026-10-11T01:00:00Z"),
      log(100, 201, "2026-10-10T01:00:00Z"),
      log(100, 101, "2026-10-01T01:00:00Z"),
    ];
    renderHome();
    expect(screen.getByText("Khatam complete")).toBeInTheDocument();
    expect(
      screen.getByText("You read all 604 pages in 30 days. MashaAllah, may it be accepted from you."),
    ).toBeInTheDocument();
    const stat = (label: string) => screen.getByText(label).nextElementSibling!.textContent;
    expect(stat("days")).toBe("30");
    expect(stat("pages a day")).toBe("20");
    expect(stat("best streak")).toBe("3");

    fireEvent.click(screen.getByRole("button", { name: "Back to home" }));
    expect(screen.getByText("Page 604, An-Nas")).toBeInTheDocument();
    cleanup();
    renderHome();
    expect(screen.queryByText("Khatam complete")).not.toBeInTheDocument();
  });

  it("shows a milestone message and saves it as shown on the account", async () => {
    data.campaigns = [plan({ id: "plan-3" })];
    data.logs = [{ ...log(160, 161, "2026-10-12T01:00:00Z"), campaign_id: "plan-3" }];
    renderHome({ withToasts: true });
    expect(await screen.findByText("📖 Quarter of the way there!")).toBeInTheDocument();
    expect(data.milestonesSaved).toEqual([{ id: "plan-3", keys: ["progress-25"] }]);
  });

  it("doesn't replay a celebration already shown on another device", () => {
    data.campaigns = [plan({ id: "plan-4", milestones_shown: ["progress-25", "progress-50", "progress-75", "complete"] })];
    data.logs = [{ ...log(604, 605, "2026-10-12T01:00:00Z"), campaign_id: "plan-4" }];
    renderHome();
    expect(screen.queryByText("Khatam complete")).not.toBeInTheDocument();
    expect(data.milestonesSaved).toEqual([]);
  });

  it("says \u201creading plan complete\u201d for part of the Quran, and starts the next plan at the goal step", () => {
    // A separate plan id: shown milestones are also remembered in memory for the session.
    data.campaigns = [plan({ id: "plan-2", title: "Juz Amma (Juz 30)", start_page: 582, start_date: "2026-10-12" })];
    data.logs = [{ ...log(23, 605, "2026-10-12T01:00:00Z"), campaign_id: "plan-2" }];
    renderHome();
    expect(screen.getByText("Reading plan complete")).toBeInTheDocument();
    expect(screen.getByText(/You read all 23 pages in 1 day\./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start a new plan" }));
    expect(screen.getByText("What would you like to read?")).toBeInTheDocument();
  });

  it("opens the log sheet from the bar, and when another tab sends the reader home to log", () => {
    data.campaigns = [plan()];
    data.logs = [log(230, 231, "2026-10-11T03:00:00Z")];
    renderHome();
    fireEvent.click(logButtons()[0]);
    expect(screen.getByLabelText("How many pages did you read?")).toBeInTheDocument();
    cleanup();

    renderHome({ openLog: true });
    expect(screen.getByLabelText("How many pages did you read?")).toBeInTheDocument();
  });

  it("explains instead of logging once the plan has ended", async () => {
    data.campaigns = [plan({ start_date: "2026-09-12", end_date: "2026-10-10" })];
    data.logs = [log(479, 480, "2026-10-09T03:00:00Z")];
    renderHome({ withToasts: true });
    fireEvent.click(logButtons()[0]);
    expect(await screen.findByText("This reading plan has ended")).toBeInTheDocument();
    expect(screen.queryByLabelText("How many pages did you read?")).not.toBeInTheDocument();
  });
});
