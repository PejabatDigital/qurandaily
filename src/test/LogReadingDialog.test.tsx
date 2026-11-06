import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Campaign } from "@/lib/api-types";

const inserts = vi.hoisted(() => [] as unknown[]);

vi.mock("@/lib/api", () => ({
  api: {
    createLog: async (values: unknown) => {
      inserts.push(values);
      return values;
    },
  },
}));

import LogReadingDialog from "@/components/LogReadingDialog";

const plan = { id: "plan-1", start_page: 1, end_page: 604 } as Campaign;

function renderDialog(lastPageMarker: number, campaign = plan) {
  const onLogged = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LogReadingDialog open onOpenChange={() => {}} campaign={campaign} lastPageMarker={lastPageMarker} onLogged={onLogged} />
    </QueryClientProvider>,
  );
  return { onLogged };
}

beforeEach(() => {
  inserts.length = 0;
});

afterEach(cleanup);

describe("LogReadingDialog", () => {
  it("opens on By count, with By page second", () => {
    renderDialog(1);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["By count", "By page"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("How many pages did you read?")).toBeInTheDocument();
  });

  it("asks for the last page read and counts it, completing a khatam on page 604", async () => {
    // Last session ended on page 603, so the reader is on 604.
    const { onLogged } = renderDialog(604);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "By page" }));
    fireEvent.change(screen.getByLabelText("What is the last page you read?"), { target: { value: "604" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(inserts[0]).toMatchObject({ pages_read: 1, current_page_marker: 605 });
  });

  it("logs 1 page by count from page 604 as the end of the plan", async () => {
    const { onLogged } = renderDialog(604);
    fireEvent.change(screen.getByLabelText("How many pages did you read?"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(inserts[0]).toMatchObject({ pages_read: 1, current_page_marker: 605 });
  });

  it("keeps the last page read within the plan", () => {
    renderDialog(590, { ...plan, start_page: 582 });
    fireEvent.mouseDown(screen.getByRole("tab", { name: "By page" }));
    fireEvent.change(screen.getByLabelText("What is the last page you read?"), { target: { value: "605" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a page between 582 and 604.");
    expect(inserts).toHaveLength(0);
  });

  it("shows the plan's last page once it's finished", () => {
    renderDialog(605);
    expect(screen.getByText("Currently on page 604 — An-Nas")).toBeInTheDocument();
  });
});
