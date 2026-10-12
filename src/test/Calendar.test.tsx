import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CalendarPage from "@/pages/Calendar";
import { TAKWIM_YEARS } from "@/lib/takwim";

function renderAt(date: Date) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(date);
  return render(<MemoryRouter><CalendarPage /></MemoryRouter>);
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
});
