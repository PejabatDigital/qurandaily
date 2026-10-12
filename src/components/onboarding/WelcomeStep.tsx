import { Calendar, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingScreen, { ScreenTitle } from "./OnboardingScreen";

const BENEFITS = [
  { icon: Target, text: "A daily target that fits your schedule" },
  { icon: Calendar, text: "Hijri dates and prayer times for Malaysia" },
  { icon: Flame, text: "Streaks and milestones to keep you going" },
];

const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
  <OnboardingScreen
    actions={
      <>
        <Button size="lg" className="w-full" onClick={onNext}>
          Get started
        </Button>
        <p className="text-xs text-muted-foreground">Free. No sign-up needed.</p>
        <p className="text-xs font-medium text-muted-foreground opacity-70">{"{ kasah kod }"}</p>
      </>
    }
  >
    <div className="flex w-full flex-col items-center gap-3 rounded-2xl bg-primary px-6 py-8 text-center text-primary-foreground">
      <p lang="ar" dir="rtl" className="w-full text-[28px] leading-[48px]" style={{ fontFamily: "Amiri, serif" }}>
        وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا
      </p>
      <p className="w-full text-sm">"And recite the Quran with measured recitation."</p>
      <p className="w-full text-xs opacity-75">Al-Muzzammil 73:4</p>
    </div>

    <div className="w-full space-y-2">
      <ScreenTitle>Read a little, every day</ScreenTitle>
      <p className="text-sm text-muted-foreground">
        Set a reading plan, log your pages after each prayer, and watch your khatam come together.
      </p>
    </div>

    <ul className="w-full space-y-3">
      {BENEFITS.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-[18px] w-[18px] text-primary" aria-hidden />
          </span>
          <span className="text-sm font-medium text-foreground">{text}</span>
        </li>
      ))}
    </ul>
  </OnboardingScreen>
);

export default WelcomeStep;
