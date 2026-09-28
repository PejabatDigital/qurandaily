import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateCampaignDialog from "@/components/CreateCampaignDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";

const Campaigns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editCampaign, setEditCampaign] = useState<Tables<"campaigns"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const openEdit = (c: Tables<"campaigns">) => {
    setEditCampaign(c);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditCampaign(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", deleteId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Campaign deleted" });
    setDeleteId(null);
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  const handleDialogCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight">Campaigns</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <Skeleton className="h-10 w-10 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Pages {c.start_page}–{c.end_page} · Ends {format(parseISO(c.end_date), "MMM d, yyyy")}
                  </p>
                  {c.is_active && (
                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Button variant="outline" className="w-full" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Campaign
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
        title="Delete Campaign"
        description="This will permanently delete this campaign and cannot be undone. Reading logs associated with this campaign will remain."
      />
    </div>
  );
};

export default Campaigns;
