import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { getStartPageForSurah, getEndPageForSurah, getSurahNumberForPage } from "@/lib/quran-data";
import SurahSelect from "@/components/SurahSelect";
import { useMutation } from "@tanstack/react-query";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  campaign?: Tables<"campaigns"> | null;
}

const CreateCampaignDialog = ({ open, onOpenChange, onCreated, campaign }: CreateCampaignDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [startSurah, setStartSurah] = useState("1");
  const [endSurah, setEndSurah] = useState("114");
  const [endDate, setEndDate] = useState("");

  const isEditing = !!campaign;

  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title);
      setStartSurah(getSurahNumberForPage(campaign.start_page));
      setEndSurah(getSurahNumberForPage(campaign.end_page));
      setEndDate(campaign.end_date);
    } else {
      setTitle("");
      setStartSurah("1");
      setEndSurah("114");
      setEndDate("");
    }
  }, [campaign, open]);

  const saveCampaign = useMutation({
    mutationFn: async (vars: { title: string; startPage: number; endPage: number; endDate: string }) => {
      if (!user) throw new Error("Your session isn't ready yet. Please try again.");
      if (campaign) {
        const { error } = await supabase
          .from("campaigns")
          .update({ title: vars.title, start_page: vars.startPage, end_page: vars.endPage, end_date: vars.endDate })
          .eq("id", campaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("campaigns").insert({
          user_id: user.id,
          title: vars.title,
          start_page: vars.startPage,
          end_page: vars.endPage,
          end_date: vars.endDate,
          is_active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      if (isEditing) {
        toast({ title: "Campaign updated!" });
      } else {
        toast({ title: "Campaign created!", description: `"${vars.title}" is now your active campaign.` });
        setTitle("");
        setStartSurah("1");
        setEndSurah("114");
        setEndDate("");
      }
      onOpenChange(false);
      onCreated();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCampaign.mutate({
      title,
      startPage: getStartPageForSurah(startSurah),
      endPage: getEndPageForSurah(endSurah),
      endDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Campaign" : "New Campaign"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your campaign details." : "Create a reading goal to track your progress."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input placeholder="e.g. Ramadan 2026" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
          <Button type="submit" className="w-full" disabled={saveCampaign.isPending}>
            {saveCampaign.isPending ? "Saving..." : isEditing ? "Update Campaign" : "Create Campaign"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignDialog;
