import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import InputField from "@/components/InputField";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, auth } from "@/lib/api";
import { RESEND_WAIT_MS, clock, codeError, loadPending, rememberedEmail, savePending, sendError, type Pending } from "@/lib/sign-in";
import { CODE_MINUTES } from "@/lib/sign-in-rules";

/**
 * The first screen for anyone without a session: email, then the 6-digit code.
 * A new email creates the account. What's typed is remembered on the device, so
 * switching to the mail app and back keeps the code step.
 */
const SignIn = () => {
  const { signedIn } = useAuth();
  const [pending, setPending] = useState<Pending | null>(() => loadPending());
  const [email, setEmail] = useState(rememberedEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  const verifying = useRef(false);

  // Redraws every second for the "Send a new code" countdown.
  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [pending]);

  const remember = (p: Pending | null) => {
    savePending(p);
    setPending(p);
  };

  const send = async (to: string) => {
    setBusy(true);
    try {
      await auth.sendCode(to);
      remember({ email: to, waitUntil: Date.now() + RESEND_WAIT_MS });
      setCodeMessage(null);
      setCode("");
    } catch (e) {
      const err = e as ApiError;
      // A code was sent a moment ago: carry on to the code step (and say why no new
      // code is coming, unless it's just the usual one-minute wait from the email step).
      if (err.code === "TOO_SOON" && err.retryAfter) {
        remember({ email: to, waitUntil: Date.now() + err.retryAfter * 1000 });
        setCodeMessage(pending || err.retryAfter * 1000 > RESEND_WAIT_MS ? sendError(err) : null);
      } else if (pending) setCodeMessage(sendError(err));
      else setEmailError(sendError(err));
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const to = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setEmailError("Enter your email address, e.g. you@example.com.");
      return;
    }
    setEmailError(null);
    send(to);
  };

  const verify = async (value: string) => {
    if (!pending || verifying.current) return;
    if (!/^\d{6}$/.test(value)) {
      setCodeMessage("Enter the 6-digit code from the email.");
      return;
    }
    verifying.current = true;
    setBusy(true);
    try {
      const user = await auth.signIn(pending.email, value);
      savePending(null);
      signedIn(user);
    } catch (e) {
      setCodeMessage(codeError(e as ApiError));
      setBusy(false);
    } finally {
      verifying.current = false;
    }
  };

  const changeCode = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    setCodeMessage(null);
    // A full code (typed or filled in from the email) signs in straight away.
    if (digits.length === 6) verify(digits);
  };

  const footer = (
    <p className="pt-2 text-caption text-muted-foreground">
      <Link to="/privacy" className="underline underline-offset-2">Privacy</Link>
      <span className="px-2 opacity-70">·</span>
      <span className="font-medium opacity-70">{"{ kasah kod }"}</span>
    </p>
  );

  if (!pending) {
    return (
      <OnboardingScreen
        title="Sign in to Quran Daily"
        subtitle="Enter your email and we'll send you a 6-digit code. New here? This creates your account."
        actions={
          <>
            <Button type="submit" form="sign-in-email" size="lg" className="w-full" disabled={busy}>
              {busy ? "Sending..." : "Send code"}
            </Button>
            {footer}
          </>
        }
      >
        <form id="sign-in-email" onSubmit={submitEmail} noValidate className="w-full">
          <InputField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            value={email}
            error={emailError}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
            }}
          />
        </form>
      </OnboardingScreen>
    );
  }

  const wait = Math.max(0, Math.ceil((pending.waitUntil - Date.now()) / 1000));

  return (
    <OnboardingScreen
      title="Check your email"
      subtitle={
        <>
          We sent a 6-digit code to <span className="font-medium text-foreground">{pending.email}</span>. It works for{" "}
          {CODE_MINUTES} minutes.
        </>
      }
      actions={
        <>
          <Button type="submit" form="sign-in-code" size="lg" className="w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </Button>
          <Button variant="ghost" className="w-full" disabled={busy || wait > 0} onClick={() => send(pending.email)}>
            {wait > 0 ? `Send a new code in ${clock(wait)}` : "Send a new code"}
          </Button>
          <Button
            variant="link"
            className="h-auto p-0 text-small text-muted-foreground"
            onClick={() => {
              remember(null);
              setCode("");
              setCodeMessage(null);
            }}
          >
            Use a different email
          </Button>
        </>
      }
    >
      <form
        id="sign-in-code"
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}
        noValidate
        className="w-full"
      >
        <InputField
          label="Code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="123456"
          className="text-title font-semibold tracking-[0.3em]"
          value={code}
          error={codeMessage}
          onChange={(e) => changeCode(e.target.value)}
        />
        <p className="pt-2 text-small text-muted-foreground">Check your spam folder</p>
      </form>
    </OnboardingScreen>
  );
};

export default SignIn;
