import { useState } from "react";
import { api } from "@/lib/api";
import type { ReadingLog } from "@/lib/api-types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useBack } from "@/hooks/useBack";
import BottomBar from "@/components/BottomBar";
import { BAR_SPACE } from "@/lib/nav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getSurahForPage, TOTAL_PAGES } from "@/lib/quran-data";
import { useQueryClient } from "@tanstack/react-query";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useReadingLogs } from "@/hooks/useReadingLogs";

/** Every reading logged, with edit and delete. `tab`: opened from the bottom bar's
 *  Progress tab (until M3 builds Progress), so it has the bar and no Back. */
const History = ({ tab = false }: { tab?: boolean }) => {
  const { toast } = useToast();
  const back = useBack("/progress");
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editLog, setEditLog] = useState<ReadingLog | null>(null);
  const [pagesRead, setPagesRead] = useState("");
  const [pageMarker, setPageMarker] = useState("");
  const [logDate, setLogDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: logs = [], isLoading: logsLoading } = useReadingLogs();
  const { data: campaigns = [] } = useCampaigns();

  const campaignMap = Object.fromEntries(campaigns.map((c) => [c.id, c.title]));

  const openEdit = (log: ReadingLog) => {
    setEditLog(log);
    setPagesRead(String(log.pages_read));
    setPageMarker(String(log.current_page_marker));
    setLogDate(format(parseISO(log.created_at), "yyyy-MM-dd'T'HH:mm"));
    setEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLog) return;
    setLoading(true);
    try {
      await api.updateLog(editLog.id, {
        pages_read: parseInt(pagesRead),
        current_page_marker: parseInt(pageMarker),
        created_at: new Date(logDate).toISOString(),
      });
      toast({ title: "Log updated!" });
      setEditOpen(false);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ["reading_logs"] });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteLog(deleteId);
      toast({ title: "Log deleted" });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
    setDeleteId(null);
    queryClient.invalidateQueries({ queryKey: ["reading_logs"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Reading history" onBack={tab ? undefined : back} />

      <main className={`mx-auto max-w-lg space-y-3 px-5 pt-4 ${tab ? BAR_SPACE : "pb-12"}`}>
        {logsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between gap-3 py-4 pl-5 pr-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-52" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : logs.length === 0 ? (
          <p className="py-12 text-center text-body text-muted-foreground">No reading logs yet.</p>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-center justify-between gap-3 py-4 pl-5 pr-3">
                <div>
                  <p className="text-body font-medium">
                    {log.pages_read} page{log.pages_read !== 1 ? "s" : ""} — Page {Math.min(log.current_page_marker, TOTAL_PAGES)}
                  </p>
                  <p className="text-small text-muted-foreground">
                    {getSurahForPage(log.current_page_marker)} · {campaignMap[log.campaign_id] || "Unknown"}
                  </p>
                  <p className="text-small text-muted-foreground">
                    {format(parseISO(log.created_at), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(log)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleteId(log.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit reading log</DialogTitle>
            <DialogDescription>Change the pages, page or time of this reading.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Pages read</Label>
              <Input type="number" min={1} value={pagesRead} onChange={(e) => setPagesRead(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Next page to read</Label>
              <Input type="number" min={1} max={TOTAL_PAGES + 1} value={pageMarker} onChange={(e) => setPageMarker(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Date and time</Label>
              <Input type="datetime-local" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete reading log"
        description="This removes this reading from your history. It can't be undone."
      />
      {tab && <BottomBar current="progress" />}
    </div>
  );
};

export default History;
