import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { format } from "date-fns";

const DAILY_QUOTES = [
  { text: "Read! In the name of your Lord who created.", source: "Al-Alaq 96:1" },
  { text: "Indeed, this Quran guides to that which is most suitable.", source: "Al-Isra 17:9" },
  { text: "And We have certainly made the Quran easy for remembrance.", source: "Al-Qamar 54:17" },
  { text: "This is the Book about which there is no doubt, a guidance for those conscious of Allah.", source: "Al-Baqarah 2:2" },
  { text: "So when the Quran is recited, then listen to it and pay attention that you may receive mercy.", source: "Al-A'raf 7:204" },
  { text: "The best of you are those who learn the Quran and teach it.", source: "Sahih al-Bukhari" },
  { text: "Whoever recites a letter from the Book of Allah will be credited with a good deed.", source: "At-Tirmidhi" },
  { text: "The Quran will be an intercessor on the Day of Judgment.", source: "Sahih Muslim" },
  { text: "Verily, with hardship comes ease.", source: "Ash-Sharh 94:6" },
  { text: "My Lord, increase me in knowledge.", source: "Ta-Ha 20:114" },
  { text: "He grants wisdom to whom He pleases; and whoever is granted wisdom is indeed given a great wealth.", source: "Al-Baqarah 2:269" },
  { text: "And say: My Lord, increase me in knowledge.", source: "Ta-Ha 20:114" },
  { text: "The likeness of the one who reads the Quran and memorises it is that of the noble scribes.", source: "Sahih al-Bukhari" },
  { text: "Take from the Quran what you can.", source: "Sahih Muslim" },
  { text: "Allah does not burden a soul beyond that it can bear.", source: "Al-Baqarah 2:286" },
];

function getDailyQuote() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return DAILY_QUOTES[seed % DAILY_QUOTES.length];
}

interface DailyInspirationCardProps {
  displayName: string | null;
  streak: number;
  pagesReadToday: number;
  dailyTarget: number;
  hasCampaign: boolean;
}

const DailyInspirationCard = ({
  displayName,
  streak,
  pagesReadToday,
  dailyTarget,
  hasCampaign,
}: DailyInspirationCardProps) => {
  const quote = getDailyQuote();
  const currentHour = new Date().getHours();
  const metTarget = pagesReadToday >= dailyTarget && dailyTarget > 0;
  const streakAtRisk = hasCampaign && streak > 0 && pagesReadToday === 0 && currentHour >= 18;

  const getNudge = () => {
    if (!hasCampaign) return "Start a campaign to begin your journey.";
    if (metTarget) return "You've hit your daily target. MashaAllah! ✨";
    if (streakAtRisk) return `Don't break your ${streak}-day streak! Even one page counts.`;
    if (streak > 0 && pagesReadToday > 0) return `You're on a ${streak}-day streak — keep it going! 🔥`;
    if (streak > 0) return `You're on a ${streak}-day streak. Read today to keep it alive!`;
    if (pagesReadToday > 0) return `You've read ${pagesReadToday} page${pagesReadToday !== 1 ? "s" : ""} today. Keep going!`;
    return "You haven't read today yet. Even one page counts.";
  };

  return (
    <Card className={`overflow-hidden border-0 shadow-md ${streakAtRisk ? "ring-2 ring-amber-400/50" : ""}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent pointer-events-none" />
      <CardContent className="relative p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            <h2 className="text-base font-semibold mt-0.5">
              Assalamualaikum{displayName ? `, ${displayName}` : ""} 👋
            </h2>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Flame className="h-3.5 w-3.5" />
              {streak}
            </div>
          )}
        </div>

        <blockquote className="border-l-2 border-primary/30 pl-3">
          <p className="text-sm italic text-foreground/80 leading-relaxed">"{quote.text}"</p>
          <cite className="text-xs text-muted-foreground not-italic mt-1 block">— {quote.source}</cite>
        </blockquote>

        <p className="text-sm text-muted-foreground leading-relaxed">{getNudge()}</p>
      </CardContent>
    </Card>
  );
};

export default DailyInspirationCard;
