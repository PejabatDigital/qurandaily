import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Campaign, ReadingLog } from "@/lib/api-types";

const data = vi.hoisted(() => ({ campaigns: [] as Campaign[], logs: [] as ReadingLog[] }));

vi.mock("@/hooks/useCampaigns", () => ({ useCampaigns: () => ({ data: data.campaigns, isLoading: false }) }));
vi.mock("@/hooks/useReadingLogs", () => ({ useReadingLogs: () => ({ data: data.logs, isLoading: false }) }));
vi.mock("@/components/WeeklyChart", () => ({ default: () => <p>Reading activity chart</p> }));

import Progress from "@/pages/Progress";

const plan = (patch: Partial<Campaign> = {}): Campaign => ({
  id: "plan-1",
  user_id: "user-1",
  title: "Juz Amma (Juz 30)",
  start_page: 1,
  end_page: 300,
  start_date: "2026-11-01",
  end_date: "2026-11-30",
  is_active: true,
  milestones_shown: [],
  created_at: "2026-11-01T01:00:00Z",
  updated_at: "2026-11-01T01:00:00Z",
  ...patch,
});

// 10 pages on each of these days of November 2026 (at 9pm Malaysia time).
const logsOn = (...days: number[]): ReadingLog[] =>
  days
    .map((d) => ({
      id: `log-${d}`,
      user_id: "user-1",
      campaign_id: "plan-1",
      pages_read: 10,
      current_page_marker: 0,
      created_at: new Date(2026, 10, d, 21, 0).toISOString(),
    }))
    .reverse();

function renderProgress() {
  render(
    <MemoryRouter initialEntries={["/progress"]}>
      <Routes>
        <Route path="/progress" element={<Progress />} />
        <Route path="/history" element={<p>History page</p>} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 10, 9, 0));
  data.campaigns = [plan()];
  data.logs = [];
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Progress", () => {
  it("shows the pace, the finish date at this pace, and how far through the plan", () => {
    // 1-9 Nov every day: 90 pages, exactly on schedule (10 a day for 30 days).
    data.logs = logsOn(1, 2, 3, 4, 5, 6, 7, 8, 9);
    renderProgress();
    expect(screen.getByRole("heading", { name: "On track" })).toBeInTheDocument();
    expect(screen.getByText("30% · 90 of 300 pages")).toBeInTheDocument();
    expect(screen.getByText("At your pace, you'll finish on Mon 30 Nov, on your end date.")).toBeInTheDocument();
  });

  it("says how far behind, and when the plan would finish", () => {
    data.logs = logsOn(1, 2, 3, 4, 5); // 50 pages; 90 expected by yesterday
    renderProgress();
    expect(screen.getByRole("heading", { name: "40 pages behind" })).toBeInTheDocument();
    expect(screen.getByText(/after your 30 Nov end date\.$/)).toBeInTheDocument();
  });

  it("invites the first reading before there is any", () => {
    renderProgress();
    expect(screen.getByRole("heading", { name: "Not started yet" })).toBeInTheDocument();
    expect(screen.getByText("Log your first reading to see your pace.")).toBeInTheDocument();
  });

  it("shows the month's reading days and the streaks", () => {
    data.logs = logsOn(1, 2, 3, 5, 6, 7, 8, 9, 10);
    renderProgress();
    const days = within(screen.getByRole("list", { name: "Days read in November 2026" })).getAllByRole("listitem");
    expect(days).toHaveLength(30);
    expect(days[3]).toHaveAccessibleName("4 November");
    expect(days[9]).toHaveAccessibleName("10 November, read, today");
    expect(screen.getByText("This month").nextSibling).toHaveTextContent("9 days");
    expect(screen.getByText("Current streak").nextSibling).toHaveTextContent("6 days");
    expect(screen.getByText("Best streak").nextSibling).toHaveTextContent("6 days");
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });

  it("goes back to earlier months of the plan", () => {
    data.campaigns = [plan({ start_date: "2026-10-20" })];
    data.logs = logsOn(1);
    renderProgress();
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("heading", { name: "October 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
  });

  it("has the chart and a link to the reading history", () => {
    renderProgress();
    expect(screen.getByText("Reading activity chart")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reading history" }));
    expect(screen.getByText("History page")).toBeInTheDocument();
  });

  it("asks for a reading plan when there isn't one", () => {
    data.campaigns = [];
    renderProgress();
    fireEvent.click(screen.getByRole("button", { name: "Set up a reading plan" }));
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });
});
