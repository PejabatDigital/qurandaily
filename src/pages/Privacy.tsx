import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
  </section>
);

/** Open to everyone (it's linked from the sign-in screen). */
const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight">Privacy</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <p className="text-sm text-foreground">Quran Daily keeps only what it needs to track your reading.</p>

        <Section title="What we store">
          <ul className="list-disc space-y-1 pl-5">
            <li>Your email address, to sign you in.</li>
            <li>The name you give us, if any.</li>
            <li>Your reading plans and reading logs.</li>
            <li>Your prayer times zone.</li>
            <li>Which milestones you've already seen, so they don't repeat.</li>
          </ul>
        </Section>

        <Section title="Where">
          <p>On Cloudflare, which runs Quran Daily.</p>
        </Section>

        <Section title="Emails">
          <p>We only email you to send your sign-in code. These emails are sent by Resend.</p>
        </Section>

        <Section title="Prayer times">
          <p>
            Prayer times come from api.waktusolat.app. Your browser asks it for your zone's times. It never receives
            your email or your reading.
          </p>
        </Section>

        <Section title="No tracking">
          <p>
            No ads, no analytics, no tracking cookies. The only cookie keeps you signed in. To stop abuse of sign-in, we
            keep the internet addresses that ask for codes for a short time, then delete them.
          </p>
        </Section>

        <Section title="Deleting your data">
          <p>
            You can delete your account at any time from Profile. This permanently removes your email, name, plans and
            logs.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            <a href="mailto:hello@kasahkod.cc" className="text-primary underline underline-offset-2">
              hello@kasahkod.cc
            </a>
          </p>
        </Section>
      </main>
    </div>
  );
};

export default Privacy;
