import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";

export function useReadingLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reading_logs", user?.id],
    queryFn: async (): Promise<Tables<"reading_logs">[]> => {
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
}
