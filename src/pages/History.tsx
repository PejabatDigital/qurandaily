import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getSurahForPage, TOTAL_PAGES } from "@/lib/quran-data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";

const History = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editLog, setEditLog] = useState<Tables<"reading_logs"> | null>(null);
  const [pagesRead, setPagesRead] = useState("");
  const [pageMarker, setPageMarker] = useState("");
  const [logDate, setLogDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["reading_logs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("reading_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("campaigns").select("*").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const campaignMap = Object.fromEntries(campaigns.map((c) => [c.id, c.title]));

  const openEdit = (log: Tables<"reading_logs">) => {
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
    const { error } = await supabase
      .from("reading_logs")
      .update({
        pages_read: parseInt(pagesRead),
        current_page_marker: parseInt(pageMarker),
        created_at: new Date(logDate).toISOString(),
      })
      .eq("id", editLog.id);
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Log updated!" }); setEditOpen(false); }
    queryClient.invalidateQueries({ queryKey: ["reading_logs"] });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("reading_logs").delete().eq("id", deleteId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Log deleted" });
    setDeleteId(null);
    queryClient.invalidateQueries({ queryKey: ["reading_logs"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight">Reading History</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-3">
        {logsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-52" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <Skeleton className="h-10 w-10 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : logs.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No reading logs yet.</p>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">
                    {log.pages_read} page{log.pages_read !== 1 ? "s" : ""} — Page {log.current_page_marker}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getSurahForPage(log.current_page_marker)} · {campaignMap[log.campaign_id] || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(log.created_at), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(log)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(log.id)}>
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
            <DialogTitle>Edit Reading Log</DialogTitle>
            <DialogDescription>Update the details of this reading session.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Pages Read</Label>
              <Input type="number" min={1} value={pagesRead} onChange={(e) => setPagesRead(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Page Marker</Label>
              <Input type="number" min={1} max={TOTAL_PAGES} value={pageMarker} onChange={(e) => setPageMarker(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Update Log"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Reading Log"
        description="This will permanently remove this reading log entry."
      />
    </div>
  );
};

export default History;
