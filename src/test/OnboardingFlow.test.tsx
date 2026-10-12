import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const calls = vi.hoisted(() => ({ updates: [] as unknown[], inserts: [] as unknown[] }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: {}, loading: false, error: null }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { display_name: null } }) }) }),
      update: (values: unknown) => ({
        eq: async () => {
          calls.updates.push({ table, values });
          return { error: null };
        },
      }),
      insert: async (values: unknown) => {
        calls.inserts.push({ table, values });
        return { error: null };
      },
    }),
  },
}));

import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

function renderFlow(props: Partial<Parameters<typeof OnboardingFlow>[0]> = {}) {
  const onComplete = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <OnboardingFlow onComplete={onComplete} {...props} />
    </QueryClientProvider>,
  );
  return { onComplete };
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const choose = (name: string | RegExp) => fireEvent.click(screen.getByRole("radio", { name }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 12, 9, 30));
  calls.updates.length = 0;
  calls.inserts.length = 0;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("OnboardingFlow", () => {
  it("creates a default 30-day khatam", async () => {
    const { onComplete } = renderFlow();
    expect(screen.getByText("Read a little, every day")).toBeInTheDocument();
    click("Get started");

    expect(screen.getByText("What would you like to read?")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Full Quran/ })).toHaveAttribute("aria-checked", "true");
    click("Continue");

    expect(screen.getByText("Finishes Tuesday, 10 November 2026")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
    expect(screen.getByText("About 4 pages after each prayer.")).toBeInTheDocument();
    expect(
      screen.getByText(`"End of Ramadan" uses JAKIM's date (9 March 2027): about 5 pages a day.`),
    ).toBeInTheDocument();
    click("Continue");

    click("Continue"); // from the beginning
    click("Skip for now");

    expect(screen.getByText("Your reading plan is ready")).toBeInTheDocument();
    expect(screen.getByText("Tue, 10 Nov 2026")).toBeInTheDocument();
    expect(screen.getByText("21 pages")).toBeInTheDocument();
    expect(screen.getByText("Page 1, Al-Fatihah")).toBeInTheDocument();
    click("Start reading");

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(calls.inserts).toEqual([
      {
        table: "campaigns",
        values: {
          user_id: "user-1",
          title: "Full Quran (khatam)",
          start_page: 1,
          end_page: 604,
          end_date: "2026-11-10",
          is_active: true,
        },
      },
    ]);
    // Only the other plans are deactivated; no name was saved.
    expect(calls.updates).toEqual([{ table: "campaigns", values: { is_active: false } }]);
  });

  it("starts from the reader's page, saves their name and keeps choices when going back", async () => {
    const { onComplete } = renderFlow({ startAt: "goal" });
    choose(/Juz Amma/);
    click("Continue");
    choose("End of Ramadan");
    click("Continue");

    choose(/I'm already reading/);
    const page = screen.getByLabelText("What page are you on?");
    fireEvent.change(page, { target: { value: "500" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a page between 582 and 604.");
    click("Continue");
    expect(screen.getByText("Where are you starting?")).toBeInTheDocument();

    fireEvent.change(page, { target: { value: "590" } });
    expect(screen.getByText("Page 590 is in Al-Buruj. 15 pages to go: 1 a day.")).toBeInTheDocument();

    // Back and forward again: the goal and finish choices are kept.
    click("Back");
    expect(screen.getByRole("radio", { name: "End of Ramadan" })).toHaveAttribute("aria-checked", "true");
    click("Continue");
    expect(screen.getByLabelText("What page are you on?")).toHaveValue(590);
    click("Continue");

    fireEvent.change(screen.getByLabelText("What should we call you?"), { target: { value: "  Aisyah " } });
    click("Continue");
    expect(screen.getByText("Page 590, Al-Buruj")).toBeInTheDocument();
    expect(screen.getByText("Tue, 9 Mar 2027")).toBeInTheDocument();
    click("Start reading");

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(calls.updates[0]).toEqual({ table: "profiles", values: { display_name: "Aisyah" } });
    expect(calls.inserts[0]).toMatchObject({
      values: { title: "Juz Amma (Juz 30)", start_page: 590, end_page: 604, end_date: "2027-03-09" },
    });
  });

  it("leaves the flow from the first step when started at the goal", () => {
    const onExit = vi.fn();
    renderFlow({ startAt: "goal", onExit });
    click("Back");
    expect(onExit).toHaveBeenCalled();
  });

  it("asks for a date when picking one", () => {
    renderFlow({ startAt: "goal" });
    click("Continue");
    choose("Pick a date");
    click("Continue");
    expect(screen.getByRole("alert")).toHaveTextContent("Pick a finish date.");
    expect(screen.getByText("When would you like to finish?")).toBeInTheDocument();
  });
});
