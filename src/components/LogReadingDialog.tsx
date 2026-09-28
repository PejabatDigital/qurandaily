import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSurahForPage, TOTAL_PAGES } from "@/lib/quran-data";
import { Tables } from "@/integrations/supabase/types";

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
  const [loading, setLoading] = useState(false);

  const handleLogByPage = async () => {
    if (!campaign || !user) return;
    const page = parseInt(currentPage);
    if (isNaN(page) || page < 1 || page > TOTAL_PAGES) {
      toast({ title: "Invalid page", description: `Enter a page between 1 and ${TOTAL_PAGES}.`, variant: "destructive" });
      return;
    }
    setLoading(true);
    const read = Math.max(0, page - lastPageMarker);
    const { error } = await supabase.from("reading_logs").insert({
      campaign_id: campaign.id,
      user_id: user.id,
      pages_read: read,
      current_page_marker: page,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged!", description: `You're now on page ${page} — ${getSurahForPage(page)}` });
      setCurrentPage("");
      onOpenChange(false);
      onLogged();
    }
  };

  const handleLogByCount = async () => {
    if (!campaign || !user) return;
    const count = parseInt(pagesRead);
    if (isNaN(count) || count < 1) {
      toast({ title: "Invalid count", description: "Enter at least 1 page.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const newMarker = Math.min(lastPageMarker + count, TOTAL_PAGES);
    const { error } = await supabase.from("reading_logs").insert({
      campaign_id: campaign.id,
      user_id: user.id,
      pages_read: count,
      current_page_marker: newMarker,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged!", description: `${count} pages recorded. Now on page ${newMarker}.` });
      setPagesRead("");
      onOpenChange(false);
      onLogged();
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Reading</DialogTitle>
          <DialogDescription>
            Currently on page {lastPageMarker} — {getSurahForPage(lastPageMarker)}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="page" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="page">By Page</TabsTrigger>
            <TabsTrigger value="count">By Count</TabsTrigger>
          </TabsList>
          <TabsContent value="page" className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>What page are you on now?</Label>
              <Input
                type="number"
                min={1}
                max={TOTAL_PAGES}
                placeholder="e.g. 42"
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
              />
            </div>
            <Button onClick={handleLogByPage} disabled={loading} className="w-full">
              Save
            </Button>
          </TabsContent>
          <TabsContent value="count" className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>How many pages did you read?</Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 5"
                value={pagesRead}
                onChange={(e) => setPagesRead(e.target.value)}
              />
            </div>
            <Button onClick={handleLogByCount} disabled={loading} className="w-full">
              Save
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LogReadingDialog;
