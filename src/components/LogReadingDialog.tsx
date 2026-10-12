import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InputField from "@/components/InputField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSurahForPage } from "@/lib/quran-data";
import { displayPage, logFromCount, logFromLastPage, pagesLabel } from "@/lib/plan";
import { Tables } from "@/integrations/supabase/types";
import { useMutation } from "@tanstack/react-query";

interface LogReadingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Tables<"campaigns"> | null;
  lastPageMarker: number;
  onLogged: () => void;
}

const LogReadingDialog = ({ open, onOpenChange, campaign, lastPageMarker, onLogged }: LogReadingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState("");
  const [pagesRead, setPagesRead] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [countError, setCountError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPageError(null);
      setCountError(null);
    }
  }, [open]);

  const logReading = useMutation({
    mutationFn: async (vars: { pagesRead: number; currentPageMarker: number; mode: "page" | "count" }) => {
      if (!campaign || !user) throw new Error("Your session isn't ready yet. Please try again.");
      const { error } = await supabase.from("reading_logs").insert({
        campaign_id: campaign.id,
        user_id: user.id,
        pages_read: vars.pagesRead,
        current_page_marker: vars.currentPageMarker,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      const lastRead = vars.currentPageMarker - 1;
      toast({
        title: "Logged!",
        description: `${pagesLabel(vars.pagesRead)} recorded. Last read: page ${lastRead}, ${getSurahForPage(lastRead)}.`,
      });
      if (vars.mode === "page") setCurrentPage("");
      else setPagesRead("");
      onOpenChange(false);
      onLogged();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleLogByPage = () => {
    if (!campaign) return;
    const page = Number(currentPage);
    if (!currentPage.trim() || !Number.isInteger(page) || page < campaign.start_page || page > campaign.end_page) {
      setPageError(`Enter a page between ${campaign.start_page} and ${campaign.end_page}.`);
      return;
    }
    const { pagesRead, nextMarker } = logFromLastPage(lastPageMarker, page);
    logReading.mutate({ pagesRead, currentPageMarker: nextMarker, mode: "page" });
  };

  const handleLogByCount = () => {
    if (!campaign) return;
    const count = parseInt(pagesRead);
    if (isNaN(count) || count < 1) {
      setCountError("Enter at least 1 page.");
      return;
    }
    const { pagesRead: read, nextMarker } = logFromCount(lastPageMarker, count, campaign.end_page);
    logReading.mutate({ pagesRead: read, currentPageMarker: nextMarker, mode: "count" });
  };

  if (!campaign) return null;
  const onPage = displayPage(lastPageMarker, campaign.end_page);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Reading</DialogTitle>
          <DialogDescription>
            Currently on page {onPage} — {getSurahForPage(onPage)}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="count" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="count">By Count</TabsTrigger>
            <TabsTrigger value="page">By Page</TabsTrigger>
          </TabsList>
          <TabsContent value="count" className="space-y-4 pt-2">
            <InputField
              label="How many pages did you read?"
              type="number"
              min={1}
              placeholder="e.g. 5"
              value={pagesRead}
              error={countError}
              onChange={(e) => { setPagesRead(e.target.value); setCountError(null); }}
            />
            <Button onClick={handleLogByCount} disabled={logReading.isPending} className="w-full">
              Save
            </Button>
          </TabsContent>
          <TabsContent value="page" className="space-y-4 pt-2">
            <InputField
              label="What is the last page you read?"
              type="number"
              min={campaign.start_page}
              max={campaign.end_page}
              placeholder="e.g. 42"
              value={currentPage}
              error={pageError}
              onChange={(e) => { setCurrentPage(e.target.value); setPageError(null); }}
            />
            <Button onClick={handleLogByPage} disabled={logReading.isPending} className="w-full">
              Save
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LogReadingDialog;
