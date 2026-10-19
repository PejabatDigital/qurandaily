import { useQuery } from "@tanstack/react-query";
import { fetchSolatMonth, DEFAULT_ZONE, SolatUnavailableError } from "@/lib/solat";
import { toast } from "@/hooks/use-toast";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";

export function useSolatMonth(zone: string, year: number, month: number) {
  return useQuery({
    queryKey: ["solat", zone, year, month],
    queryFn: () => fetchSolatMonth(zone, year, month),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
    retry: (failures, error) => !(error instanceof SolatUnavailableError) && failures < 1,
  });
}

/** The prayer zone saved on the account (the default until one is chosen). */
export function useSelectedZone(): [string, (z: string) => void] {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const setZone = (z: string) =>
    updateProfile.mutate(
      { prayer_zone: z },
      { onError: (error) => toast({ title: "Couldn't save your prayer zone", description: error.message, variant: "destructive" }) },
    );
  return [profile?.prayer_zone ?? DEFAULT_ZONE, setZone];
}
