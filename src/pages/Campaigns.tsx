import { useState } from "react";
import { api } from "@/lib/api";
import type { Campaign } from "@/lib/api-types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useBack } from "@/hooks/useBack";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import CreateCampaignDialog from "@/components/CreateCampaignDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaigns } from "@/hooks/useCampaigns";

const Campaigns = () => {
  const { toast } = useToast();
  const back = useBack("/settings");
  const queryClient = useQueryClient();
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: campaigns = [], isLoading } = useCampaigns();

  const openEdit = (c: Campaign) => {
    setEditCampaign(c);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditCampaign(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteCampaign(deleteId);
      toast({ title: "Reading plan deleted" });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
    setDeleteId(null);
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["reading_logs"] });
  };

  const handleDialogCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Reading plans" onBack={back} />

      <main className="mx-auto max-w-lg px-5 pb-12 pt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between gap-3 py-4 pl-5 pr-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between gap-3 py-4 pl-5 pr-3">
                <div>
                  <p className="text-body font-medium">{c.title}</p>
                  <p className="text-small text-muted-foreground">
                    Pages {c.start_page}–{c.end_page} · Ends {format(parseISO(c.end_date), "MMM d, yyyy")}
                  </p>
                  {c.is_active && (
                    <span className="mt-1.5 inline-block rounded-full bg-accent-soft px-2 py-[3px] text-caption font-medium text-primary">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleteId(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Button variant="outline" size="lg" className="w-full" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New reading plan
        </Button>
      </main>

      <CreateCampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleDialogCreated}
        campaign={editCampaign}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete reading plan"
        description="This deletes the reading plan and every reading logged on it. It can't be undone."
      />
    </div>
  );
};

export default Campaigns;
