import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ZONES, zoneByCode } from "@/lib/solat";
import { useSelectedZone } from "@/hooks/useSolat";
import { cn } from "@/lib/utils";
import { ChevronDown, MapPin } from "lucide-react";

interface ZonePickerProps {
  variant?: "compact" | "inline";
  className?: string;
}

export function ZonePicker({ variant = "compact", className }: ZonePickerProps) {
  const [zone, setZone] = useSelectedZone();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const current = zoneByCode(zone);

  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = !needle
      ? ZONES
      : ZONES.filter(
          (z) =>
            z.code.toLowerCase().includes(needle) ||
            z.negeri.toLowerCase().includes(needle) ||
            z.daerah.toLowerCase().includes(needle),
        );
    const map = new Map<string, typeof ZONES>();
    for (const z of filtered) {
      const arr = map.get(z.negeri) ?? [];
      arr.push(z);
      map.set(z.negeri, arr);
    }
    return Array.from(map.entries());
  }, [q]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground",
            variant === "inline" && "border-transparent bg-transparent px-1 py-0 text-[11px] underline-offset-2 hover:underline",
            className,
          )}
          aria-label="Change prayer zone"
        >
          <MapPin className="h-3 w-3" />
          <span className="font-mono">{zone}</span>
          <span className="hidden sm:inline text-muted-foreground/70">·</span>
          <span className="hidden max-w-[10rem] truncate sm:inline">{current?.daerah ?? ""}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search state or district"
          className="mb-2 h-8 text-sm"
        />
        <ul className="max-h-72 overflow-y-auto">
          {grouped.map(([negeri, items]) => (
            <li key={negeri} className="mb-2">
              <div className="px-2 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {negeri}
              </div>
              {items.map((z) => (
                <button
                  key={z.code}
                  onClick={() => {
                    setZone(z.code);
                    setOpen(false);
                    setQ("");
                  }}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-md px-2 py-1.5 text-left transition",
                    zone === z.code
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="text-xs leading-tight">{z.daerah}</span>
                  <span className="font-mono text-[10px] text-primary">{z.code}</span>
                </button>
              ))}
            </li>
          ))}
          {grouped.length === 0 && (
            <li className="px-2 py-3 text-center text-xs text-muted-foreground">No matches</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
