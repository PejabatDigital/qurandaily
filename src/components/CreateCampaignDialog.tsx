import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import InputField from "@/components/InputField";
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
  /** Open with the finish date focused (e.g. "Extend finish date"). */
  focusEndDate?: boolean;
}

const CreateCampaignDialog = ({ open, onOpenChange, onCreated, campaign, focusEndDate }: CreateCampaignDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [startSurah, setStartSurah] = useState("1");
  const [endSurah, setEndSurah] = useState("114");
  const [endDate, setEndDate] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

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
    setTitleError(null);
    setEndDateError(null);
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
          start_date: format(new Date(), "yyyy-MM-dd"),
          end_date: vars.endDate,
          is_active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      if (isEditing) {
        toast({ title: "Reading plan updated!" });
      } else {
        toast({ title: "Reading plan created!", description: `"${vars.title}" is now your active reading plan.` });
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
    const trimmedTitle = title.trim();
    const titleMissing = !trimmedTitle;
    const endDateMissing = !endDate;
    setTitleError(titleMissing ? "Give your reading plan a name." : null);
    setEndDateError(endDateMissing ? "Pick a finish date." : null);
    if (titleMissing || endDateMissing) return;
    // Keep the plan's exact pages unless a different surah was picked: a plan
    // can start mid-surah (e.g. "I'm already reading" from page 214).
    const keepStart = campaign && startSurah === getSurahNumberForPage(campaign.start_page);
    const keepEnd = campaign && endSurah === getSurahNumberForPage(campaign.end_page);
    saveCampaign.mutate({
      title: trimmedTitle,
      startPage: keepStart ? campaign.start_page : getStartPageForSurah(startSurah),
      endPage: keepEnd ? campaign.end_page : getEndPageForSurah(endSurah),
      endDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        onOpenAutoFocus={(e) => {
          if (!focusEndDate) return;
          e.preventDefault();
          endDateRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit reading plan" : "New reading plan"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your reading plan details." : "Create a reading goal to track your progress."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <InputField
            label="Reading plan name"
            placeholder="e.g. Ramadan khatam"
            value={title}
            error={titleError}
            onChange={(e) => { setTitle(e.target.value); setTitleError(null); }}
          />
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
          <InputField
            ref={endDateRef}
            label="End Date"
            type="date"
            value={endDate}
            error={endDateError}
            onChange={(e) => { setEndDate(e.target.value); setEndDateError(null); }}
          />
          <Button type="submit" className="w-full" disabled={saveCampaign.isPending}>
            {saveCampaign.isPending ? "Saving..." : isEditing ? "Update reading plan" : "Create reading plan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignDialog;
