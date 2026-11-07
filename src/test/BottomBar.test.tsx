import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import BottomBar from "@/components/BottomBar";

const Where = () => {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + (location.state ? JSON.stringify(location.state) : "")}</p>;
};

function renderBar(path: string, current: "home" | "progress" | "calendar" | "settings") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<><BottomBar current={current} /><Where /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe("BottomBar", () => {
  it("shows the five places in order and marks the current tab", () => {
    renderBar("/calendar", "calendar");
    const names = screen.getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Home", "Progress", "Log reading", "Calendar", "Settings"]);
    expect(screen.getByRole("button", { name: "Calendar" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("goes to a tab when it's tapped", () => {
    renderBar("/calendar", "calendar");
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/settings");
  });

  it("sends the reader home to log when Log is tapped on another tab", () => {
    renderBar("/settings", "settings");
    fireEvent.click(screen.getByRole("button", { name: "Log reading" }));
    expect(screen.getByTestId("where")).toHaveTextContent('/{"log":true}');
  });
});
