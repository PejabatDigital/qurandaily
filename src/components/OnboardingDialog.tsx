import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getStartPageForSurah, getEndPageForSurah } from "@/lib/quran-data";
import SurahSelect from "@/components/SurahSelect";
import { BookOpen, ArrowRight } from "lucide-react";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const OnboardingDialog = ({ open, onOpenChange, onComplete }: OnboardingDialogProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [startSurah, setStartSurah] = useState("1");
  const [endSurah, setEndSurah] = useState("114");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStep1 = async () => {
    if (!displayName.trim()) return;
    if (!user || !session) {
      toast({ title: "Error", description: "Your session isn't ready yet. Please try again.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleStep2 = async () => {
    if (!campaignTitle.trim() || !endDate) return;
    if (!user || !session) {
      toast({ title: "Error", description: "Your session isn't ready yet. Please try again.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const startPage = getStartPageForSurah(startSurah);
    const endPage = getEndPageForSurah(endSurah);

    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      title: campaignTitle.trim(),
      start_page: startPage,
      end_page: endPage,
      end_date: endDate,
      is_active: true,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome aboard!", description: "Your first campaign is ready. Start reading!" });
      onOpenChange(false);
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {step === 1 ? "Welcome to Quran Daily" : "Create Your First Campaign"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 1
              ? "Let's get you set up. What should we call you?"
              : "Set a reading goal to track your progress."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                placeholder="e.g. Ahmad"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
              />
            </div>
            <Button className="w-full" onClick={handleStep1} disabled={!displayName.trim() || loading}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                placeholder="e.g. Ramadan 2026"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Surah</Label>
                <SurahSelect value={startSurah} onValueChange={setStartSurah} />
              </div>
              <div className="space-y-2">
                <Label>End Surah</Label>
                <SurahSelect value={endSurah} onValueChange={setEndSurah} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <Button
              className="w-full"
              onClick={handleStep2}
              disabled={!campaignTitle.trim() || !endDate || loading}
            >
              {loading ? "Creating..." : "Start My Journey"}
            </Button>
          </div>
        )}

        <div className="flex justify-center gap-1.5">
          <div className={`h-1.5 w-6 rounded-full ${step === 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-1.5 w-6 rounded-full ${step === 2 ? "bg-primary" : "bg-muted"}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
