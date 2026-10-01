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
import { useMutation } from "@tanstack/react-query";

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

  const updateDisplayName = useMutation({
    mutationFn: async (name: string) => {
      if (!user || !session) throw new Error("Your session isn't ready yet. Please try again.");
      const { error } = await supabase.from("profiles").update({ display_name: name }).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => setStep(2),
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createFirstCampaign = useMutation({
    mutationFn: async (vars: { title: string; startPage: number; endPage: number; endDate: string }) => {
      if (!user || !session) throw new Error("Your session isn't ready yet. Please try again.");
      const { error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        title: vars.title,
        start_page: vars.startPage,
        end_page: vars.endPage,
        end_date: vars.endDate,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Welcome aboard!", description: "Your first campaign is ready. Start reading!" });
      onOpenChange(false);
      onComplete();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleStep1 = () => {
    if (!displayName.trim()) return;
    updateDisplayName.mutate(displayName.trim());
  };

  const handleStep2 = () => {
    if (!campaignTitle.trim() || !endDate) return;
    createFirstCampaign.mutate({
      title: campaignTitle.trim(),
      startPage: getStartPageForSurah(startSurah),
      endPage: getEndPageForSurah(endSurah),
      endDate,
    });
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
            <Button className="w-full" onClick={handleStep1} disabled={!displayName.trim() || updateDisplayName.isPending}>
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
              disabled={!campaignTitle.trim() || !endDate || createFirstCampaign.isPending}
            >
              {createFirstCampaign.isPending ? "Creating..." : "Start My Journey"}
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
