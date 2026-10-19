import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "@/lib/api";

const mocks = vi.hoisted(() => ({
  sendCode: vi.fn(),
  signIn: vi.fn(),
  signedIn: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  auth: { sendCode: mocks.sendCode, signIn: mocks.signIn },
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ signedIn: mocks.signedIn }) }));

import SignIn from "@/pages/SignIn";

const renderSignIn = () =>
  render(
    <MemoryRouter>
      <SignIn />
    </MemoryRouter>,
  );

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const typeEmail = (value: string) => fireEvent.change(screen.getByLabelText("Email"), { target: { value } });
const typeCode = (value: string) => fireEvent.change(screen.getByLabelText("Code"), { target: { value } });

async function reachCodeStep(email = "reader@example.com") {
  renderSignIn();
  typeEmail(email);
  click("Send code");
  await screen.findByText("Check your email");
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 19, 9, 0, 0));
  localStorage.clear();
  mocks.sendCode.mockReset().mockResolvedValue({ success: true });
  mocks.signIn.mockReset();
  mocks.signedIn.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Sign-in screen", () => {
  it("asks for a real email address", () => {
    renderSignIn();
    typeEmail("not-an-email");
    click("Send code");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter your email address");
    expect(mocks.sendCode).not.toHaveBeenCalled();
  });

  it("sends a code and asks for it, with the spam folder hint", async () => {
    await reachCodeStep(" Reader@Example.com ");
    expect(mocks.sendCode).toHaveBeenCalledWith("reader@example.com");
    expect(screen.getByText("reader@example.com")).toBeInTheDocument();
    expect(screen.getByText("Check your spam folder")).toBeInTheDocument();
    const code = screen.getByLabelText("Code");
    expect(code).toHaveAttribute("autocomplete", "one-time-code");
    expect(code).toHaveAttribute("inputmode", "numeric");
  });

  it("signs in as soon as the 6 digits are in", async () => {
    mocks.signIn.mockResolvedValue({ id: "u1", email: "reader@example.com" });
    await reachCodeStep();
    typeCode("123 456");
    await waitFor(() => expect(mocks.signedIn).toHaveBeenCalledWith({ id: "u1", email: "reader@example.com" }));
    expect(mocks.signIn).toHaveBeenCalledWith("reader@example.com", "123456");
    expect(localStorage.getItem("qd:sign-in")).toBeNull();
  });

  it.each([
    ["INVALID_OTP", "That code isn't right. Check the email and try again."],
    ["OTP_EXPIRED", "That code has expired. Send a new code."],
    ["TOO_MANY_ATTEMPTS", "Too many wrong tries. Send a new code."],
  ])("explains %s", async (code, message) => {
    mocks.signIn.mockRejectedValue(new ApiError(400, "x", code));
    await reachCodeStep();
    typeCode("111111");
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(mocks.signedIn).not.toHaveBeenCalled();
  });

  it("waits a minute before a new code can be sent", async () => {
    await reachCodeStep();
    expect(screen.getByRole("button", { name: "Send a new code in 1:00" })).toBeDisabled();

    vi.setSystemTime(new Date(2026, 9, 19, 9, 1, 0));
    await act(async () => {
      fireEvent.change(screen.getByLabelText("Code"), { target: { value: "1" } }); // re-render
    });
    click("Send a new code");
    await waitFor(() => expect(mocks.sendCode).toHaveBeenCalledTimes(2));
  });

  it("remembers the step when coming back from the mail app", async () => {
    await reachCodeStep();
    cleanup();
    renderSignIn();
    expect(screen.getByText("Check your email")).toBeInTheDocument();
    expect(screen.getByText("reader@example.com")).toBeInTheDocument();
  });

  it("goes back to the email, filled in, once the code has expired", async () => {
    await reachCodeStep();
    cleanup();
    vi.setSystemTime(new Date(2026, 9, 19, 9, 11, 0));
    renderSignIn();
    expect(screen.getByLabelText("Email")).toHaveValue("reader@example.com");
  });

  it("carries on to the code step when a code was just sent", async () => {
    mocks.sendCode.mockRejectedValue(new ApiError(429, "x", "TOO_SOON", 40));
    await reachCodeStep();
    expect(screen.getByRole("button", { name: "Send a new code in 0:40" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("says when too many codes were asked for", async () => {
    mocks.sendCode.mockRejectedValue(new ApiError(429, "x", "TOO_SOON", 1800));
    await reachCodeStep();
    expect(screen.getByRole("alert")).toHaveTextContent("You can ask for a new code in 30 minutes.");
  });

  it("can switch to a different email", async () => {
    await reachCodeStep();
    click("Use a different email");
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("explains when it can't connect", async () => {
    mocks.sendCode.mockRejectedValue(new ApiError(0, "x"));
    renderSignIn();
    typeEmail("reader@example.com");
    click("Send code");
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't connect.");
  });
});
