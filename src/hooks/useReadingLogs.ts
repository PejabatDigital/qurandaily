import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/** The signed-in user's reading logs, newest first. */
export function useReadingLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reading_logs", user?.id],
    queryFn: api.logs,
    enabled: !!user,
  });
}
