import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DayPrayer } from "@/lib/solat";

// Made-up prayer times for any month (the same each day), so nothing is fetched.
vi.mock("@/hooks/useSolat", () => ({
  useSelectedZone: () => ["WLY01", () => {}],
  useSolatMonth: (_zone: string, year: number, month: number) => {
    const at = (day: number, h: number, m: number) => Date.UTC(year, month - 1, day, h - 8, m) / 1000;
    const prayers: DayPrayer[] = Array.from({ length: 31 }, (_, i) => ({
      day: i + 1, hijri: "",
      fajr: at(i + 1, 5, 48), syuruk: at(i + 1, 7, 0), dhuhr: at(i + 1, 13, 0),
      asr: at(i + 1, 16, 21), maghrib: at(i + 1, 18, 58), isha: at(i + 1, 20, 10),
    }));
    return { data: { prayers }, isLoading: false, isError: false, error: null };
  },
}));
vi.mock("@/hooks/useProfile", () => ({ useProfile: () => ({ data: null }), useUpdateProfile: () => ({ mutate: () => {} }) }));

import CalendarPage from "@/pages/Calendar";
import { TAKWIM_YEARS } from "@/lib/takwim";

function renderAt(date: Date) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(date);
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter><CalendarPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Calendar page", () => {
  it("shows the current month and year", () => {
    renderAt(new Date(2026, 9, 12));
    expect(screen.getByText("October 2026")).toBeInTheDocument();
    expect(screen.queryByText(/not yet available/)).not.toBeInTheDocument();
  });

  it("shows a friendly message for a year without data", () => {
    renderAt(new Date(2099, 2, 1));
    expect(screen.getByText("March 2099")).toBeInTheDocument();
    expect(screen.getByText("Calendar not yet available for 2099")).toBeInTheDocument();
  });

  it("can move back from a year without data to the latest year with data", () => {
    renderAt(new Date(2099, 0, 15));
    fireEvent.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText(`December ${TAKWIM_YEARS[TAKWIM_YEARS.length - 1]}`)).toBeInTheDocument();
  });

  it("stops at the first month with data", () => {
    renderAt(new Date(TAKWIM_YEARS[0], 0, 15));
    expect(screen.getByLabelText("Previous month")).toBeDisabled();
  });

  it("shows this week's prayer times from today, with the next prayer in bold", () => {
    renderAt(new Date(2026, 10, 7, 15, 30));
    const table = screen.getByRole("table", { name: /next six days/ });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.map((r) => within(r).getByRole("rowheader").textContent)).toEqual([
      "Today7", "Sun8", "Mon9", "Tue10", "Wed11", "Thu12", "Fri13",
    ]);
    expect(within(rows[0]).getByText("16:21")).toHaveClass("font-semibold");
    expect(within(rows[0]).getByText("13:00")).not.toHaveClass("font-semibold");
  });

  it("shows the month on the 1st when the week runs into a new month", () => {
    renderAt(new Date(2026, 10, 28, 9, 0));
    const table = screen.getByRole("table", { name: /next six days/ });
    expect(within(table).getByText("1 Dec")).toBeInTheDocument();
  });
});
