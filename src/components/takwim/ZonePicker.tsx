import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ZONES, zoneByCode } from "@/lib/solat";
import { useSelectedZone } from "@/hooks/useSolat";
import { cn } from "@/lib/utils";
import { ChevronDown, MapPin } from "lucide-react";

interface ZonePickerProps {
  /** "field" is a full-width select-style trigger for forms. */
  variant?: "compact" | "inline" | "field";
  className?: string;
  id?: string;
  "aria-describedby"?: string;
}

export function ZonePicker({ variant = "compact", className, id, "aria-describedby": describedBy }: ZonePickerProps) {
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
        {variant === "field" ? (
          <button
            id={id}
            type="button"
            aria-describedby={describedBy}
            className={cn(
              "flex h-12 w-full items-center justify-between gap-2 rounded-xl border-2 border-transparent bg-subtle px-3.5 text-left text-[17px] leading-6 text-foreground focus-visible:border-primary focus-visible:outline-none",
              className,
            )}
          >
            <span className="truncate">
              {zone}
              {current && ` · ${current.daerah}`}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ) : (
          <button
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full bg-subtle px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
              variant === "inline" && "h-auto bg-transparent px-1 py-0 text-[12px] underline-offset-2 hover:underline",
              className,
            )}
            aria-label="Change prayer zone"
          >
            <MapPin className="h-3 w-3" />
            <span>{zone}</span>
            <span className="hidden sm:inline text-muted-foreground/70">·</span>
            <span className="hidden max-w-[10rem] truncate sm:inline">{current?.daerah ?? ""}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={variant === "field" ? "start" : "end"}
        className={cn("p-2", variant === "field" ? "w-[var(--radix-popover-trigger-width)]" : "w-72")}
      >
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search state or district"
          className="mb-2 h-10 text-[15px]"
        />
        <ul className="max-h-72 overflow-y-auto">
          {grouped.map(([negeri, items]) => (
            <li key={negeri} className="mb-2">
              <div className="px-3 pb-1 pt-2 text-[13px] font-medium leading-4 text-muted-foreground">
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
                    "flex min-h-11 w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-left transition-colors",
                    zone === z.code ? "bg-accent-soft text-foreground" : "text-foreground hover:bg-subtle",
                  )}
                >
                  <span className="text-[15px] leading-5">{z.daerah}</span>
                  <span className="text-[12px] font-medium text-muted-foreground">{z.code}</span>
                </button>
              ))}
            </li>
          ))}
          {grouped.length === 0 && (
            <li className="px-3 py-3 text-center text-[13px] text-muted-foreground">No matches</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
