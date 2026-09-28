import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchSolatMonth, DEFAULT_ZONE } from "@/lib/solat";

const STORAGE_KEY = "takwim:zone";

export function useSolatMonth(zone: string, year: number, month: number) {
  return useQuery({
    queryKey: ["solat", zone, year, month],
    queryFn: () => fetchSolatMonth(zone, year, month),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
    retry: 1,
  });
}

export function useSelectedZone(): [string, (z: string) => void] {
  const [zone, setZoneState] = useState<string>(DEFAULT_ZONE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setZoneState(stored);
    } catch {
      // ignore
    }
  }, []);

  const setZone = (z: string) => {
    setZoneState(z);
    try {
      localStorage.setItem(STORAGE_KEY, z);
    } catch {
      // ignore
    }
  };

  return [zone, setZone];
}
